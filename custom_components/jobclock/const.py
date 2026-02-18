"""Constants for the JobClock integration."""

DOMAIN = "jobclock"

CONF_PERSON = "person_entity"
CONF_ZONE = "work_zone"
CONF_OFFICE_SWITCH = "home_office_switch"
CONF_ENTRY_DELAY = "entry_delay"
CONF_EXIT_DELAY = "exit_delay"
CONF_MIN_STAY = "min_stay_duration"

# Phase 2: Target Hours & History
CONF_DAILY_TARGET = "daily_target_hours"
CONF_WORK_DAYS = "work_days"

DEFAULT_ENTRY_DELAY = 3
DEFAULT_EXIT_DELAY = 5
DEFAULT_MIN_STAY = 10
DEFAULT_DAILY_TARGET = 8.0
DEFAULT_WORK_DAYS = ["mon", "tue", "wed", "thu", "fri"]

ICON_WORK_TIME = "mdi:clock-check-outline"
ICON_STATUS_ON = "mdi:briefcase"
ICON_STATUS_OFF = "mdi:briefcase-off-outline"
ICON_HOME_OFFICE = "mdi:home-laptop"

WORK_DAYS_OPTIONS = {
    "mon": "Monday",
    "tue": "Tuesday",
    "wed": "Wednesday",
    "thu": "Thursday",
    "fri": "Friday",
    "sat": "Saturday",
    "sun": "Sunday",
}
