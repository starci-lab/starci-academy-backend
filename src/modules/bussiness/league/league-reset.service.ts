import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Cron,
} from "@nestjs/schedule"
import {
    envConfig,
} from "@modules/env"
import {
    LeagueWeeklyResetException,
} from "@modules/exceptions"
import {
    LeagueService,
} from "./league.service"

@Injectable()
/**
 * Cron driver for the weekly-league reset. Fires once per week (Sunday 00:00
 * Asia/Ho_Chi_Minh by default) and delegates the actual settlement +
 * cohort-forming to {@link LeagueService.runWeeklyReset}. Any failure is wrapped
 * in a typed {@link LeagueWeeklyResetException} and logged (never re-thrown) so a
 * bad run cannot crash the scheduler — the reset is idempotent and self-heals on
 * the next trigger.
 */
export class LeagueResetService {
    /** Logger scoped to this service for easy grep of reset issues. */
    private readonly logger = new Logger(LeagueResetService.name)

    constructor(
        private readonly leagueService: LeagueService,
    ) {}

    /**
     * Run the weekly reset on the configured cron schedule, in the
     * Asia/Ho_Chi_Minh timezone so the week boundary matches the business rule.
     */
    @Cron(
        envConfig().league.weeklyResetCron,
        {
            name: "league-weekly-reset",
            timeZone: "Asia/Ho_Chi_Minh",
        },
    )
    async handleWeeklyReset(): Promise<void> {
        try {
            // delegate the whole settle + re-bucket to the service (one txn)
            await this.leagueService.runWeeklyReset()
            // confirm completion so ops can see the reset ran
            this.logger.log("Weekly league reset completed")
        } catch (error) {
            // normalize the caught value to an Error at the boundary
            const cause = error instanceof Error ? error : new Error(String(error))
            // wrap in a typed, groupable exception (week unknown here → "current")
            const exception = new LeagueWeeklyResetException({
                weekStartAt: "current",
                originalError: cause,
            })
            // log Error-style (message + stack) and swallow — next week self-heals
            this.logger.error(exception.message,
                cause.stack)
        }
    }
}
