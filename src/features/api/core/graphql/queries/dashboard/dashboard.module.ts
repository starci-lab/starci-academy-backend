import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./dashboard.module-definition"
import {
    MyCoursesSingleQueryModule,
} from "./my-courses"
import {
    MyLearnedLessonsSingleQueryModule,
} from "./my-learned-lessons"
import {
    MyInProgressChallengesSingleQueryModule,
} from "./my-in-progress-challenges"
import {
    MyWeeklyStatsSingleQueryModule,
} from "./my-weekly-stats"
import {
    MyKpisSingleQueryModule,
} from "./my-kpis"
import {
    MyContributionCalendarSingleQueryModule,
} from "./my-contribution-calendar"
import {
    TrendingContentsSingleQueryModule,
} from "./trending-contents"
import {
    MyFeedSingleQueryModule,
} from "./my-feed"
import {
    ActiveAdvertisementSingleQueryModule,
} from "./active-advertisement"
import {
    ChangelogEntriesSingleQueryModule,
} from "./changelog-entries"
import {
    MyUpcomingLivestreamsSingleQueryModule,
} from "./my-upcoming-livestreams"
import {
    WeeklyChallengeSingleQueryModule,
} from "./weekly-challenge"
import {
    RewardsSingleQueryModule,
} from "./rewards"
import {
    MyRewardWalletSingleQueryModule,
} from "./my-reward-wallet"

/**
 * Dashboard query group — logged-in home leaf queries (one resolver per rail
 * section: courses / learned lessons / in-progress challenges / weekly stats) plus
 * the cursor-paginated feed and the right-rail content (ad banner + changelog).
 */
@Module({
    imports: [
        MyCoursesSingleQueryModule.register({
            isGlobal: true,
        }),
        MyLearnedLessonsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyInProgressChallengesSingleQueryModule.register({
            isGlobal: true,
        }),
        MyWeeklyStatsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyKpisSingleQueryModule.register({
            isGlobal: true,
        }),
        MyContributionCalendarSingleQueryModule.register({
            isGlobal: true,
        }),
        TrendingContentsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyFeedSingleQueryModule.register({
            isGlobal: true,
        }),
        ActiveAdvertisementSingleQueryModule.register({
            isGlobal: true,
        }),
        ChangelogEntriesSingleQueryModule.register({
            isGlobal: true,
        }),
        MyUpcomingLivestreamsSingleQueryModule.register({
            isGlobal: true,
        }),
        WeeklyChallengeSingleQueryModule.register({
            isGlobal: true,
        }),
        RewardsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyRewardWalletSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class DashboardQueriesModule extends ConfigurableModuleClass {}
