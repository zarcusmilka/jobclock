"""Constants for the JobClock integration."""

DOMAIN = "jobclock"

CONF_PERSON = "person_entity"
CONF_ZONE = "work_zone"
CONF_OFFICE_SWITCH = "home_office_switch"
CONF_ENTRY_DELAY = "entry_delay"
CONF_EXIT_DELAY = "exit_delay"
CONF_MIN_STAY = "min_stay_duration"

DEFAULT_ENTRY_DELAY = 3
DEFAULT_EXIT_DELAY = 5
DEFAULT_MIN_STAY = 10

ICON_WORK_TIME = "mdi:clock-check-outline"
ICON_STATUS_ON = "mdi:briefcase"
ICON_STATUS_OFF = "mdi:briefcase-off-outline"
ICON_HOME_OFFICE = "mdi:home-laptop"
