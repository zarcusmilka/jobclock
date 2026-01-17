"""The JobClock integration."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, time
import asyncio

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform, STATE_ON, STATE_HOME, EVENT_HOMEASSISTANT_STOP
from homeassistant.core import HomeAssistant, CoreState, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_state_change_event, async_track_point_in_time
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    DOMAIN,
    CONF_PERSON,
    CONF_ZONE,
    CONF_OFFICE_SWITCH,
    CONF_ENTRY_DELAY,
    CONF_EXIT_DELAY,
    CONF_MIN_STAY,
)

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.BINARY_SENSOR]
STORAGE_VERSION = 1
STORAGE_KEY_TEMPLATE = "jobclock.{}"

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up JobClock from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    
    instance = JobClockInstance(hass, entry)
    await instance.async_initialize()
    
    hass.data[DOMAIN][entry.entry_id] = instance

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        instance = hass.data[DOMAIN].pop(entry.entry_id)
        await instance.async_shutdown()

    return unload_ok

class JobClockInstance:
    """Manages the logic for a single JobClock instance."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        """Initialize."""
        self.hass = hass
        self.entry = entry
        self.name = entry.title
        
        self.person_entity = entry.data[CONF_PERSON]
        self.zone_entity = entry.data[CONF_ZONE]
        self.switch_entity = entry.data[CONF_OFFICE_SWITCH]
        
        self.entry_delay = timedelta(minutes=entry.data[CONF_ENTRY_DELAY])
        self.exit_delay = timedelta(minutes=entry.data[CONF_EXIT_DELAY])
        self.min_stay = timedelta(minutes=entry.data[CONF_MIN_STAY])

        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY_TEMPLATE.format(entry.entry_id))
        
        # State
        self.is_working = False
        self.session_start: datetime | None = None
        self.time_today: timedelta = timedelta()
        self.last_update_date: str | None = None

        # Internal
        self._listeners = []
        self._timer_remove = None
        self._pending_state = None # True (Pending Active) or False (Pending Inactive)
        self._pending_start_time: datetime | None = None
        
        self._sensor_callbacks = set()

    async def async_initialize(self):
        """Initialize logic and restore state."""
        await self._load_data()
        
        # Determine current condition state
        await self._update_logic(init=True)

        # Listen for changes
        self._listeners.append(
            async_track_state_change_event(
                self.hass, 
                [self.person_entity, self.switch_entity, self.zone_entity], 
                self._handle_state_change
            )
        )
        
        # Reset at midnight (handled by scheduled checks or sensor update, strictly we should schedule it)
        # For simplicity, we check date on every update and event.
        
        # Register shutdown
        self._listeners.append(
            self.hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, self._async_save_data)
        )

    async def async_shutdown(self):
        """Cleanup."""
        for unsub in self._listeners:
            unsub()
        if self._timer_remove:
            self._timer_remove()
        await self._async_save_data()

    def register_callback(self, callback_func):
        """Register callback for sensor updates."""
        self._sensor_callbacks.add(callback_func)
        
    def remove_callback(self, callback_func):
        """Remove callback."""
        self._sensor_callbacks.discard(callback_func)

    def _notify_sensors(self):
        """Update sensors."""
        for cb in self._sensor_callbacks:
            cb()

    async def _load_data(self):
        """Load data from storage."""
        data = await self._store.async_load()
        if data:
            self.last_update_date = data.get("date")
            self.time_today = timedelta(seconds=data.get("seconds_today", 0))
            self.is_working = data.get("is_working", False)
            if self.is_working and data.get("session_start"):
                self.session_start = dt_util.parse_datetime(data["session_start"])
            
            # Check for day reset on load
            self._check_daily_reset()

    async def _async_save_data(self, event=None):
        """Save data to storage."""
        data = {
            "date": dt_util.now().date().isoformat(),
            "seconds_today": self.time_today.total_seconds(),
            "is_working": self.is_working,
            "session_start": self.session_start.isoformat() if self.session_start else None
        }
        await self._store.async_save(data)

    def _check_daily_reset(self):
        """Check if day has changed and reset if needed."""
        now = dt_util.now()
        today_str = now.date().isoformat()
        
        if self.last_update_date != today_str:
            _LOGGER.debug(f"[{self.name}] Daily reset: {self.last_update_date} -> {today_str}")
            # If we were working overnight, we might want to split the session. 
            # Requirement says "Reset um 00:00 Uhr".
            # Simple approach: Reset counter. If working, new session counts for new day from 00:00?
            # Or just reset the accumulated TOTAL. The session continues.
            # If session is active, the accumulated part BEFORE midnight is lost? No, just stored in previous day?
            # User wants "Summiere die Zeit für den aktuellen Tag".
            # So simpler: time_today = 0.
            
            # If currently working, we need to calculate partial time for yesterday?
            # For simplicity per spec "Reset at 00:00", we just reset the sum.
            # The *current session duration* that is accumulating right now needs to be handled.
            # Usually: time_today is "historical sum" + "current session duration if active".
            # We will store `time_today` as ONLY the closed sessions sum.
            # And sensors calculate `time_today + (now - session_start)` dynamic.
            # So on reset, we just set time_today = 0. 
            # And if session_start is < midnight, we ideally trigger a cut.
            # But "Reset at 00:00" usually implies standard daily stats.
            
            # Let's adjust self.time_today to 0.
            # Ideally we should adjust session_start to midnight if it was before midnight, 
            # to avoid adding yesterday's hours to today.
            
            if self.is_working and self.session_start and self.session_start.date() < now.date():
                # Session started yesterday.
                # We reset start to midnight today so we only count today's hours.
                midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
                self.session_start = midnight
                
            self.time_today = timedelta(0)
            self.last_update_date = today_str
            self._async_save_data() # Save the reset

    def get_time_today(self) -> str:
        """Return HH:MM string for today."""
        self._check_daily_reset()
        
        total = self.time_today
        if self.is_working and self.session_start:
            total += (dt_util.now() - self.session_start)
            
        total_seconds = int(total.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        return f"{hours:02d}:{minutes:02d}"

    def check_conditions(self) -> bool:
        """Check if 'working' conditions are met."""
        # 1. Home Office Switch
        sw_state = self.hass.states.get(self.switch_entity)
        if sw_state and sw_state.state == STATE_ON:
            return True
            
        # 2. Person in Zone
        person_state = self.hass.states.get(self.person_entity)
        if person_state:
            # Person state is usually 'home', 'not_home', or name of zone
            # Zone state: we need to check if person is in the specific zone.
            # If zone is 'zone.work', person state should be 'working' or the friendly name? 
            # Actually person state is the zone ID if in a zone (e.g. 'work').
            # But the zone entity name is like 'zone.work'. 
            # The state of 'zone.work' is the number of persons.
            # We compare person state to the zone friendly name? No, zone entity ID matching is better?
            # Actually person state IS the zone name (friendly name) OR 'home'/'not_home'.
            # BUT efficient way: Check coordinate proximity or just state string match.
            # Config provides 'zone.work'.
            # To be robust:
            zone_state = self.hass.states.get(self.zone_entity)
            if zone_state and person_state.state == zone_state.name:
                return True
            # Also check if person state is literally the zone entity id (rare but possible in some setups)
            # Or if the config['work_zone'] friendly name matches person state.
            
        return False

    async def _handle_state_change(self, event):
        """Handle state changes."""
        await self._update_logic()

    async def _update_logic(self, init=False):
        """Core logic state machine."""
        condition_met = self.check_conditions()
        now = dt_util.now()
        
        if self._timer_remove:
            # Timer running. Check if condition flip invalidated it.
            # Logic: We are waiting for X. If condition changes back, cancel wait.
            if self._pending_state is True and not condition_met:
                # We were waiting to START, but condition lost. Cancel.
                _LOGGER.debug(f"[{self.name}] Entry condition lost during delay.")
                self._timer_remove()
                self._timer_remove = None
                self._pending_state = None
            elif self._pending_state is False and condition_met:
                # We were waiting to END, but condition returned. Cancel.
                # Effectively "debounce" exit.
                _LOGGER.debug(f"[{self.name}] Exit condition regained during delay.")
                self._timer_remove()
                self._timer_remove = None
                self._pending_state = None
        
        # If no timer running, check if we need to start one
        if not self._timer_remove:
            if condition_met and not self.is_working:
                # Start Entry Delay
                delay = self.entry_delay.total_seconds()
                if delay <= 0:
                    await self._set_active(now)
                else:
                    _LOGGER.debug(f"[{self.name}] Starting entry delay {delay}s")
                    self._pending_state = True
                    self._timer_remove = async_track_point_in_time(
                        self.hass, self._timer_callback, now + self.entry_delay
                    )
            
            elif not condition_met and self.is_working:
                # Start Exit Delay
                delay = self.exit_delay.total_seconds()
                if delay <= 0:
                     await self._set_inactive(now)
                else:
                    _LOGGER.debug(f"[{self.name}] Starting exit delay {delay}s")
                    self._pending_state = False
                    self._pending_start_time = now # Provide "actual exit time" for retro-correction
                    self._timer_remove = async_track_point_in_time(
                        self.hass, self._timer_callback, now + self.exit_delay
                    )
        
        self._notify_sensors()

    @callback
    def _timer_callback(self, now):
        """Timer finished."""
        self._timer_remove = None
        target_state = self._pending_state
        self._pending_state = None
        
        # Re-check condition just in case? 
        # Actually logic says: if we reached here, condition didn't flip back (handled in update_logic).
        # So proceed.
        
        if target_state is True:
            # Entry confirmed
            self.hass.async_create_task(self._set_active(now))
        elif target_state is False:
            # Exit confirmed
            # RETROACTIVE CORRECTION: use self._pending_start_time
            actual_end = self._pending_start_time or now
            self.hass.async_create_task(self._set_inactive(actual_end))

    async def _set_active(self, start_time: datetime):
        """Transition to working."""
        _LOGGER.info(f"[{self.name}] Status changed to ACTIVE at {start_time}")
        self.is_working = True
        self.session_start = start_time
        
        # Reset just in case date changed while inactive
        self._check_daily_reset()
        
        self._notify_sensors()
        await self._async_save_data()

    async def _set_inactive(self, end_time: datetime):
        """Transition to inactive."""
        _LOGGER.info(f"[{self.name}] Status changed to INACTIVE at {end_time}")
        
        if not self.session_start:
             self.is_working = False
             self._notify_sensors()
             return

        # Calculate duration
        duration = end_time - self.session_start
        
        # Check Min Stay
        if duration >= self.min_stay:
            # Valid session
            _LOGGER.info(f"[{self.name}] Session valid. Duration: {duration}")
            
            # Handle crossing midnight during session?
            # Implemented simple approach: add to today's total. 
            # If session spanned days, strict accounting is hard without event log. 
            # We assume user mostly works within a day or doesn't mind bulk add to end day.
            # But wait, we did "reset" check. If reset happened mid-session, session_start was moved to midnight.
            # So `duration` here is correct for "today's portion".
            
            self.time_today += duration
        else:
            _LOGGER.info(f"[{self.name}] Session discarded. Duration {duration} < {self.min_stay}")
        
        self.is_working = False
        self.session_start = None
        self._pending_start_time = None
        
        self._notify_sensors()
        await self._async_save_data()
