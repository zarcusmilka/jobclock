"""Sensor platform for JobClock."""
from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, ICON_WORK_TIME

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the JobClock sensor."""
    instance = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([JobClockTimeSensor(instance, entry)], True)

class JobClockTimeSensor(SensorEntity):
    """Representation of a JobClock time sensor."""

    def __init__(self, instance, entry):
        """Initialize the sensor."""
        self._instance = instance
        self._entry = entry
        
        self._attr_name = f"JobClock {entry.title} Today"
        self._attr_unique_id = f"{entry.entry_id}_today"
        self._attr_icon = ICON_WORK_TIME
        self._attr_native_value = "00:00"

    async def async_added_to_hass(self):
        """Register callbacks."""
        self._instance.register_callback(self.async_write_ha_state)

    async def async_will_remove_from_hass(self):
        """Remove callbacks."""
        self._instance.remove_callback(self.async_write_ha_state)

    @property
    def native_value(self):
        """Return the state of the sensor."""
        return self._instance.get_time_today()

    @property
    def extra_state_attributes(self):
        """Return the state attributes."""
        return {
            "entry_id": self._entry.entry_id
        }
