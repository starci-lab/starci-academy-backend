import {
    APP_TIMEZONE,
} from "@modules/lib/common/constants/timezone"

/**
 * SQL expr for the start of the CURRENT KPI week: the most recent Monday 08:00
 * Asia/Ho_Chi_Minh (GMT+7, no DST). Shift -8h before truncating to Monday
 * 00:00 then shift +8h back, so a moment before this Monday's 8am still
 * resolves to LAST week's start. Shared by every "weekly" KPI subquery
 * (`user-stats-projection.service.ts`), the reward-floor upsert
 * (`set-kpi-target.resolver.ts`), and the reward claim so the notion of "week"
 * can never drift apart between them.
 */
export const KPI_WEEK_START_SQL = `(date_trunc('week', (now() AT TIME ZONE '${APP_TIMEZONE}') - interval '8 hours') + interval '8 hours') AT TIME ZONE '${APP_TIMEZONE}'`
