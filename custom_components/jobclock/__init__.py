"""The JobClock integration."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, date as datetime_date
import asyncio
import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform, STATE_ON, STATE_HOME, EVENT_HOMEASSISTANT_STOP
from homeassistant.core import HomeAssistant, CoreState, callback
from homeassistant.helpers import entity_registry as er, config_validation as cv
from homeassistant.helpers.event import async_track_state_change_event, async_track_point_in_time
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.components import websocket_api
from homeassistant.components.http import StaticPathConfig

from .const import (
    DOMAIN,
    CONF_PERSON,
    CONF_ZONE,
    CONF_OFFICE_SWITCH,
    CONF_ENTRY_DELAY,
    CONF_EXIT_DELAY,
    CONF_MIN_STAY,
    CONF_DAILY_TARGET,
    CONF_WORK_DAYS,
    DEFAULT_DAILY_TARGET,
    DEFAULT_WORK_DAYS,
    DEFAULT_ENTRY_DELAY,
    DEFAULT_EXIT_DELAY,
    DEFAULT_MIN_STAY,
)

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.BINARY_SENSOR]
STORAGE_VERSION = 2  # Updated for history
STORAGE_KEY_TEMPLATE = "jobclock.{}"

# Websocket API Schemas
WS_GET_DATA_SCHEMA = websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
    vol.Required("type"): "jobclock/get_data",
    vol.Required("entry_id"): str,
    vol.Required("start_date"): str,
    vol.Required("end_date"): str,
})

WS_UPDATE_ENTRY_SCHEMA = websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
    vol.Required("type"): "jobclock/update_entry",
    vol.Required("entry_id"): str,
    vol.Required("date"): str,
    vol.Optional("duration"): vol.Any(int, float, None),
    vol.Optional("status_type"): str, # 'work', 'sick', 'vacation'
})

WS_MANUAL_TOGGLE_SCHEMA = websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
    vol.Required("type"): "jobclock/manual_toggle",
    vol.Required("entry_id"): str,
    vol.Required("action"): str,  # 'start' or 'stop'
})

WS_UPDATE_SESSIONS_SCHEMA = websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
    vol.Required("type"): "jobclock/update_sessions",
    vol.Required("entry_id"): str,
    vol.Required("date"): str,
    vol.Required("sessions"): vol.All(
        cv.ensure_list,
        [
            vol.Schema({
                vol.Required("start"): str,
                vol.Required("end"): str,
                vol.Required("duration"): vol.Any(int, float),
                vol.Optional("location"): str,
            })
        ],
    ),
    vol.Optional("status_type"): str,
})

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up JobClock from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    
    # Register Websocket API only once
    if "jobclock_api_registered" not in hass.data[DOMAIN]:
        websocket_api.async_register_command(hass, ws_get_data)
        websocket_api.async_register_command(hass, ws_update_entry)
        websocket_api.async_register_command(hass, ws_manual_toggle)
        websocket_api.async_register_command(hass, ws_update_sessions)
        hass.data[DOMAIN]["jobclock_api_registered"] = True

    # Register Panel & Static Path
    if "jobclock_panel_registered" not in hass.data[DOMAIN]:
        # Serve the 'www' directory
        path = hass.config.path("custom_components", "jobclock", "www")
        await hass.http.async_register_static_paths([
            StaticPathConfig(
                "/jobclock_static", path, cache_headers=True
            )
        ])
        
        # Register the panel
        # Try to use panel_custom component
        from homeassistant.components import panel_custom
        
        try:
            await panel_custom.async_register_panel(
                hass,
                webcomponent_name="jobclock-panel",
                frontend_url_path="jobclock",
                module_url="/jobclock_static/jobclock-panel.js?v=1.4.4",
                sidebar_title="JobClock",
                sidebar_icon="mdi:briefcase-clock",
                require_admin=False,
            )
            hass.data[DOMAIN]["jobclock_panel_registered"] = True
        except Exception as e:
            _LOGGER.error("Failed to register JobClock panel: %s", e)
            # Fallback or older method if needed, but for now we catch to avoid boot loop

    
    instance = JobClockInstance(hass, entry)
    await instance.async_initialize()
    
    hass.data[DOMAIN][entry.entry_id] = instance

    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True

async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload the config entry when options change."""
    await hass.config_entries.async_reload(entry.entry_id)

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        instance = hass.data[DOMAIN].pop(entry.entry_id)
        await instance.async_shutdown()

    return unload_ok


@websocket_api.async_response
async def ws_get_data(hass, connection, msg):
    """Handle get data command."""
    entry_id = msg["entry_id"]
    instance = hass.data[DOMAIN].get(entry_id)
    if not instance:
        connection.send_error(msg["id"], "instance_not_found", "Instance not found")
        return

    start_date = dt_util.parse_date(msg["start_date"])
    end_date = dt_util.parse_date(msg["end_date"])
    
    if not start_date or not end_date:
        connection.send_error(msg["id"], "invalid_date", "Invalid dates")
        return

    data = await instance.get_history_range(start_date, end_date)
    connection.send_result(msg["id"], data)

ws_get_data._ws_schema = WS_GET_DATA_SCHEMA
ws_get_data._ws_command = "jobclock/get_data"


@websocket_api.async_response
async def ws_update_entry(hass, connection, msg):
    """Handle update entry command."""
    entry_id = msg["entry_id"]
    instance = hass.data[DOMAIN].get(entry_id)
    if not instance:
        connection.send_error(msg["id"], "instance_not_found", "Instance not found")
        return

    date_obj = dt_util.parse_date(msg["date"])
    if not date_obj:
        connection.send_error(msg["id"], "invalid_date", "Invalid date")
        return

    duration = msg.get("duration")
    status_type = msg.get("status_type")
    
    await instance.update_history_day(date_obj, duration=duration, status_type=status_type)
    connection.send_result(msg["id"], {"status": "ok"})

ws_update_entry._ws_schema = WS_UPDATE_ENTRY_SCHEMA
ws_update_entry._ws_command = "jobclock/update_entry"


@websocket_api.async_response
async def ws_manual_toggle(hass, connection, msg):
    """Handle manual start/stop — bypasses all delays."""
    entry_id = msg["entry_id"]
    instance = hass.data[DOMAIN].get(entry_id)
    if not instance:
        connection.send_error(msg["id"], "instance_not_found", "Instance not found")
        return

    action = msg["action"]
    now = dt_util.now()

    # Cancel any pending delay timers
    if instance._timer_remove:
        instance._timer_remove()
        instance._timer_remove = None
        instance._pending_state = None

    if action == "start" and not instance.is_working:
        await instance._set_active(now)
    elif action == "stop" and instance.is_working:
        await instance._set_inactive(now, manual=True)

    connection.send_result(msg["id"], {
        "status": "ok",
        "is_working": instance.is_working
    })

ws_manual_toggle._ws_schema = WS_MANUAL_TOGGLE_SCHEMA
ws_manual_toggle._ws_command = "jobclock/manual_toggle"


@websocket_api.async_response
async def ws_update_sessions(hass, connection, msg):
    """Handle update sessions command."""
    entry_id = msg["entry_id"]
    instance = hass.data[DOMAIN].get(entry_id)
    if not instance:
        connection.send_error(msg["id"], "instance_not_found", "Instance not found")
        return

    date_obj = dt_util.parse_date(msg["date"])
    if not date_obj:
        connection.send_error(msg["id"], "invalid_date", "Invalid date")
        return

    sessions = msg.get("sessions")
    status_type = msg.get("status_type")
    
    await instance.update_history_sessions(date_obj, sessions=sessions, status_type=status_type)
    connection.send_result(msg["id"], {"status": "ok"})

ws_update_sessions._ws_schema = WS_UPDATE_SESSIONS_SCHEMA
ws_update_sessions._ws_command = "jobclock/update_sessions"


class JobClockInstance:
    """Manages the logic for a single JobClock instance."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        """Initialize."""
        self.hass = hass
        self.entry = entry
        self.name = entry.title
        
        # Determine config source (options override data)
        self.get_conf = lambda k, default: entry.options.get(k, entry.data.get(k, default))
        
        self.person_entity = self.get_conf(CONF_PERSON, None)
        self.zone_entity = self.get_conf(CONF_ZONE, None)
        self.switch_entity = self.get_conf(CONF_OFFICE_SWITCH, None)
        
        self.entry_delay = timedelta(minutes=self.get_conf(CONF_ENTRY_DELAY, DEFAULT_ENTRY_DELAY))
        self.exit_delay = timedelta(minutes=self.get_conf(CONF_EXIT_DELAY, DEFAULT_EXIT_DELAY))
        self.min_stay = timedelta(minutes=self.get_conf(CONF_MIN_STAY, DEFAULT_MIN_STAY))
        
        self.daily_target = self.get_conf(CONF_DAILY_TARGET, DEFAULT_DAILY_TARGET)
        self.work_days = self.get_conf(CONF_WORK_DAYS, DEFAULT_WORK_DAYS)

        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY_TEMPLATE.format(entry.entry_id))
        
        # State
        self.is_working = False
        self.session_start: datetime | None = None
        
        # History: "YYYY-MM-DD": {"duration": seconds, "type": "work"|"sick"|"vacation", "sessions": [...]}
        self.history = {} 
        self.last_update_date: str | None = None

        # Internal
        self._listeners = []
        self._timer_remove = None
        self._pending_state = None
        self._pending_start_time: datetime | None = None
        self._sensor_callbacks = set()

    async def async_initialize(self):
        """Initialize logic and restore state."""
        await self._load_data()
        await self._update_logic(init=True)

        self._listeners.append(
            async_track_state_change_event(
                self.hass, 
                [self.person_entity, self.switch_entity, self.zone_entity], 
                self._handle_state_change
            )
        )
        self._listeners.append(
            self.hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, self._async_save_data)
        )
        # Periodic save (every hour? or just close enough on stop)
        # We also listen for time changes to update "duration today" visually?
        # Ideally the sensor updates every minute if working.
        self._listeners.append(
            async_track_point_in_time(self.hass, self._update_periodic, dt_util.now() + timedelta(minutes=1))
        )

    async def _update_periodic(self, now):
        """Periodic update."""
        if self.is_working:
             self._notify_sensors()
        # Schedule next
        self._listeners.append(
             async_track_point_in_time(self.hass, self._update_periodic, now + timedelta(minutes=1))
        )

    async def async_shutdown(self):
        """Cleanup."""
        for unsub in self._listeners:
            unsub()
        if self._timer_remove:
            self._timer_remove()
        await self._async_save_data()

    def register_callback(self, callback_func):
        self._sensor_callbacks.add(callback_func)
    def remove_callback(self, callback_func):
        self._sensor_callbacks.discard(callback_func)
    def _notify_sensors(self):
        for cb in self._sensor_callbacks:
            cb()

    async def _load_data(self):
        """Load data from storage."""
        data = await self._store.async_load()
        if data:
            self.history = data.get("history", {})
            
            # Migration
            # v1: {"date": ..., "seconds_today": ...}
            # v2: {"history": {"YYYY-MM-DD": {"duration": ..., "type": ...}}}
            # v3: Added "sessions" key to history entries
            for day in self.history.values():
                if "sessions" not in day:
                    day["sessions"] = []
            
            if "history" not in data and "date" in data:
                # Migrate v1 single day
                d = data["date"]
                self.history[d] = {
                    "duration": data.get("seconds_today", 0),
                    "type": "work",
                    "sessions": []
                }
            
            self.last_update_date = dt_util.now().date().isoformat()
            
            self.is_working = data.get("is_working", False)
            if self.is_working and data.get("session_start"):
                self.session_start = dt_util.parse_datetime(data["session_start"])
            
            self._check_daily_reset()

    async def _async_save_data(self, event=None):
        """Save data to storage."""
        data = {
            "history": self.history,
            "is_working": self.is_working,
            "session_start": self.session_start.isoformat() if self.session_start else None
        }
        await self._store.async_save(data)

    def _check_daily_reset(self):
        """Check if day has changed."""
        now = dt_util.now()
        today_str = now.date().isoformat()
        
        # If we crossed midnight, simple check:
        # If session is active, splitting is hard. We won't split session automatically here for now.
        # But we ensure we are writing to the correct "today" bucket in history.
        # History keys are simply dates.
        pass

    def get_time_today_seconds(self) -> int:
        """Return total seconds for today."""
        today_str = dt_util.now().date().isoformat()
        day_data = self.history.get(today_str, {})
        total = day_data.get("duration", 0)
        
        if self.is_working and self.session_start:
            # Add current session
            total += (dt_util.now() - self.session_start).total_seconds()
            
        return int(total)

    def get_time_today(self) -> str:
        """Return HH:MM string for today."""
        total_seconds = self.get_time_today_seconds()
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        return f"{hours:02d}:{minutes:02d}"

    async def get_history_range(self, start_date: datetime_date, end_date: datetime_date):
        """Get data for a date range."""
        result = []
        current = start_date
        while current <= end_date:
            d_str = current.isoformat()
            data = self.history.get(d_str, {"duration": 0, "type": "work", "sessions": []})
            
            # If "today", add live
            if current == dt_util.now().date() and self.is_working:
                live_seconds = self.get_time_today_seconds() # includes stored + session
                data = data.copy()
                data["duration"] = live_seconds
                # We don't append the "live" session to sessions list here, 
                # frontend handles showing "currently active".
            
            # Calculate Delta
            week_day_short = current.strftime("%a").lower()
            target = 0
            if data.get("type", "work") == "work":
                 if week_day_short in self.work_days:
                      target = self.daily_target * 3600
            
            if data.get("type") in ["vacation", "sick"]:
                if week_day_short in self.work_days:
                    data["duration"] = self.daily_target * 3600 # Auto-fill
                    target = self.daily_target * 3600
            
            delta = data["duration"] - target
            
            result.append({
                "date": d_str,
                "duration": data["duration"],
                "type": data.get("type", "work"),
                "target": target,
                "delta": delta,
                "sessions": data.get("sessions", [])
            })
            current += timedelta(days=1)
        return result

    async def update_history_day(self, date_obj: datetime_date, duration=None, status_type=None):
        """Update history manually."""
        d_str = date_obj.isoformat()
        if d_str not in self.history:
            self.history[d_str] = {"duration": 0, "type": "work", "sessions": []}
            
        if duration is not None:
            self.history[d_str]["duration"] = float(duration)
            # If manual edit, we might want to clear sessions to avoid confusion
            # but for now let's keep them as "audit log"
        if status_type is not None:
            self.history[d_str]["type"] = status_type
            
        await self._async_save_data()
        self._notify_sensors()

    async def update_history_sessions(self, date_obj: datetime_date, sessions=None, status_type=None):
        """Update sessions and recalculate duration."""
        d_str = date_obj.isoformat()
        if d_str not in self.history:
            self.history[d_str] = {"duration": 0, "type": "work", "sessions": []}
            
        if sessions is not None:
            self.history[d_str]["sessions"] = sessions
            # Recalculate total duration
            total_dur = sum(s.get("duration", 0) for s in sessions)
            self.history[d_str]["duration"] = total_dur
            
        if status_type is not None:
            self.history[d_str]["type"] = status_type
            
        await self._async_save_data()
        self._notify_sensors()

    # --- Logic Conditions ---
    # Auto-tracking is ONLY based on zone presence.
    # The switch_entity is used for Office/Home distinction only.
    def check_conditions(self) -> bool:
        person_state = self.hass.states.get(self.person_entity)
        if person_state:
            zone_state = self.hass.states.get(self.zone_entity)
            if zone_state and person_state.state == zone_state.name:
                return True
        return False

    async def _handle_state_change(self, event):
        await self._update_logic()

    async def _update_logic(self, init=False):
        condition_met = self.check_conditions()
        now = dt_util.now()
        
        if self._timer_remove:
            if self._pending_state is True and not condition_met:
                self._timer_remove()
                self._timer_remove = None
                self._pending_state = None
            elif self._pending_state is False and condition_met:
                self._timer_remove()
                self._timer_remove = None
                self._pending_state = None
        
        if not self._timer_remove:
            if condition_met and not self.is_working:
                delay = self.entry_delay.total_seconds()
                if delay <= 0:
                    await self._set_active(now)
                else:
                    self._pending_state = True
                    self._timer_remove = async_track_point_in_time(
                        self.hass, self._timer_callback, now + self.entry_delay
                    )
            elif not condition_met and self.is_working:
                delay = self.exit_delay.total_seconds()
                if delay <= 0:
                     await self._set_inactive(now)
                else:
                    self._pending_state = False
                    self._pending_start_time = now
                    self._timer_remove = async_track_point_in_time(
                        self.hass, self._timer_callback, now + self.exit_delay
                    )
        self._notify_sensors()

    @callback
    def _timer_callback(self, now):
        self._timer_remove = None
        target_state = self._pending_state
        self._pending_state = None
        if target_state is True:
            self.hass.async_create_task(self._set_active(now))
        elif target_state is False:
            actual_end = self._pending_start_time or now
            self.hass.async_create_task(self._set_inactive(actual_end))

    async def _set_active(self, start_time: datetime):
        self.is_working = True
        self.session_start = start_time
        # Record location at session start (switch ON = Home Office, OFF = Office)
        sw_state = self.hass.states.get(self.switch_entity)
        self._session_location = "home" if (sw_state and sw_state.state == STATE_ON) else "office"
        self._notify_sensors()
        await self._async_save_data()

    async def _set_inactive(self, end_time: datetime, manual: bool = False):
        if not self.session_start:
             self.is_working = False
             self._notify_sensors()
             return

        duration = (end_time - self.session_start).total_seconds()
        
        # Manual stops always record; auto-stops respect min_stay
        if manual or duration >= self.min_stay.total_seconds():
            today_str = self.session_start.date().isoformat()
            if today_str not in self.history:
                self.history[today_str] = {"duration": 0, "type": "work", "sessions": []}
            
            # Log session
            session = {
                "start": self.session_start.isoformat(),
                "end": end_time.isoformat(),
                "duration": duration,
                "location": getattr(self, "_session_location", "office")
            }
            if "sessions" not in self.history[today_str]:
                self.history[today_str]["sessions"] = []
            self.history[today_str]["sessions"].append(session)
            
            self.history[today_str]["duration"] += duration
        
        self.is_working = False
        self.session_start = None
        self._pending_start_time = None
        
        self._notify_sensors()
        await self._async_save_data()
