/**
 * The single IANA timezone every "daily"/"weekly" calendar-day boundary in the
 * platform is reckoned against (Vietnam local time, UTC+7, no DST). Streak,
 * daily-quest, and every weekly-KPI subquery must all cast `created_at`/`now()`
 * through THIS constant — never a private literal copy — so the notion of
 * "today"/"this week" can never drift apart between them.
 */
export const APP_TIMEZONE = "Asia/Ho_Chi_Minh"
