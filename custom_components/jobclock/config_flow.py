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
    SelectSelector,
    SelectSelectorConfig,
)

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
    DEFAULT_ENTRY_DELAY,
    DEFAULT_EXIT_DELAY,
    DEFAULT_MIN_STAY,
    DEFAULT_DAILY_TARGET,
    DEFAULT_WORK_DAYS,
    WORK_DAYS_OPTIONS,
)

class JobClockConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for JobClock."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Create the options flow."""
        return JobClockOptionsFlowHandler(config_entry)

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
                            min=0, max=60, mode="box", unit_of_measurement="min"
                        )
                    ),
                    vol.Required(
                        CONF_EXIT_DELAY, default=DEFAULT_EXIT_DELAY
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=0, max=60, mode="box", unit_of_measurement="min"
                        )
                    ),
                    vol.Required(
                        CONF_MIN_STAY, default=DEFAULT_MIN_STAY
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=0, max=120, mode="box", unit_of_measurement="min"
                        )
                    ),
                    vol.Required(
                        CONF_DAILY_TARGET, default=DEFAULT_DAILY_TARGET
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=0, max=24, step=0.5, mode="box", unit_of_measurement="h"
                        )
                    ),
                    vol.Required(
                        CONF_WORK_DAYS, default=DEFAULT_WORK_DAYS
                    ): SelectSelector(
                        SelectSelectorConfig(
                            options=[{"label": v, "value": k} for k, v in WORK_DAYS_OPTIONS.items()],
                            multiple=True,
                            mode="dropdown",
                        )
                    ),
                }
            ),
            errors=errors,
        )

class JobClockOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle options for JobClock."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        # Fix for HA 2024.12+: config_entry is a read-only property on the parent
        # We must initialize the parent with it.
        super().__init__()
        # We don't set self.config_entry manually if the parent handles it or if it's read-only.
        # However, looking at recent HA source, standard is simply:
        # super().__init__() and accessing self.config_entry (which is set by the handler system?)
        # Wait, the error was "property 'config_entry' ... has no setter".
        # This means we CANNOT do `self.config_entry = config_entry`.
        # The flow manager sets it. We just need to store it if we need it, but usually we don't need to write to it.
        # But wait, `async_step_init` uses it? No because we removed usage.
        # Let's just remove the assignment.
        pass

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        # Get current config or options
        current_daily = self.config_entry.options.get(
            CONF_DAILY_TARGET, self.config_entry.data.get(CONF_DAILY_TARGET, DEFAULT_DAILY_TARGET)
        )
        current_days = self.config_entry.options.get(
            CONF_WORK_DAYS, self.config_entry.data.get(CONF_WORK_DAYS, DEFAULT_WORK_DAYS)
        )
        
        # We allow editing other params too, ideally
        current_entry_delay = self.config_entry.options.get(
            CONF_ENTRY_DELAY, self.config_entry.data.get(CONF_ENTRY_DELAY, DEFAULT_ENTRY_DELAY)
        )
        current_exit_delay = self.config_entry.options.get(
            CONF_EXIT_DELAY, self.config_entry.data.get(CONF_EXIT_DELAY, DEFAULT_EXIT_DELAY)
        )
        current_min_stay = self.config_entry.options.get(
            CONF_MIN_STAY, self.config_entry.data.get(CONF_MIN_STAY, DEFAULT_MIN_STAY)
        )

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_ENTRY_DELAY, default=current_entry_delay
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=0, max=60, mode="box", unit_of_measurement="min"
                        )
                    ),
                    vol.Required(
                        CONF_EXIT_DELAY, default=current_exit_delay
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=0, max=60, mode="box", unit_of_measurement="min"
                        )
                    ),
                    vol.Required(
                        CONF_MIN_STAY, default=current_min_stay
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=0, max=120, mode="box", unit_of_measurement="min"
                        )
                    ),
                    vol.Required(
                        CONF_DAILY_TARGET, default=current_daily
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=0, max=24, step=0.5, mode="box", unit_of_measurement="h"
                        )
                    ),
                    vol.Required(
                        CONF_WORK_DAYS, default=current_days
                    ): SelectSelector(
                        SelectSelectorConfig(
                            options=[{"label": v, "value": k} for k, v in WORK_DAYS_OPTIONS.items()],
                            multiple=True,
                            mode="dropdown",
                        )
                    ),
                }
            ),
        )
