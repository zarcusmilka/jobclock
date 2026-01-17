"""Config flow for JobClock integration."""
from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_NAME
from homeassistant.core import HomeAssistant, callback
import homeassistant.helpers.config_validation as cv
from homeassistant.helpers.selector import (
    EntitySelector,
    EntitySelectorConfig,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
)

from .const import (
    DOMAIN,
    CONF_PERSON,
    CONF_ZONE,
    CONF_OFFICE_SWITCH,
    CONF_ENTRY_DELAY,
    CONF_EXIT_DELAY,
    CONF_MIN_STAY,
    DEFAULT_ENTRY_DELAY,
    DEFAULT_EXIT_DELAY,
    DEFAULT_MIN_STAY,
)

class JobClockConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for JobClock."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Handle the initial step."""
        errors = {}

        if user_input is not None:
            self._async_abort_entries_match({CONF_NAME: user_input[CONF_NAME]})
            return self.async_create_entry(title=user_input[CONF_NAME], data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_NAME): str,
                    vol.Required(CONF_PERSON): EntitySelector(
                        EntitySelectorConfig(domain="person")
                    ),
                    vol.Required(CONF_ZONE): EntitySelector(
                        EntitySelectorConfig(domain="zone")
                    ),
                    vol.Required(CONF_OFFICE_SWITCH): EntitySelector(
                        EntitySelectorConfig(domain="input_boolean")
                    ),
                    vol.Required(
                        CONF_ENTRY_DELAY, default=DEFAULT_ENTRY_DELAY
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=0, max=60, mode=NumberSelectorMode.BOX, unit_of_measurement="min"
                        )
                    ),
                    vol.Required(
                        CONF_EXIT_DELAY, default=DEFAULT_EXIT_DELAY
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=0, max=60, mode=NumberSelectorMode.BOX, unit_of_measurement="min"
                        )
                    ),
                    vol.Required(
                        CONF_MIN_STAY, default=DEFAULT_MIN_STAY
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=0, max=120, mode=NumberSelectorMode.BOX, unit_of_measurement="min"
                        )
                    ),
                }
            ),
            errors=errors,
        )
