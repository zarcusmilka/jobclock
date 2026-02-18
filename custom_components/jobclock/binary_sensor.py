"""Binary sensor platform for JobClock."""
from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, ICON_STATUS_ON, ICON_STATUS_OFF

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the JobClock binary sensor."""
    instance = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([JobClockStatusSensor(instance, entry)], True)

class JobClockStatusSensor(BinarySensorEntity):
    """Representation of a JobClock status sensor."""

    def __init__(self, instance, entry):
        """Initialize the sensor."""
        self._instance = instance
        self._entry = entry
        
        self._attr_name = f"JobClock {entry.title} Status"
        self._attr_unique_id = f"{entry.entry_id}_status"

    async def async_added_to_hass(self):
        """Register callbacks."""
        self._instance.register_callback(self.async_write_ha_state)

    async def async_will_remove_from_hass(self):
        """Remove callbacks."""
        self._instance.remove_callback(self.async_write_ha_state)

    @property
    def is_on(self):
        """Return true if the binary sensor is on."""
        return self._instance.is_working

    @property
    def icon(self):
        """Return the icon to use in the frontend."""
        return ICON_STATUS_ON if self.is_on else ICON_STATUS_OFF
