import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./dashboard.module-definition"
import {
    MyCoursesSingleQueryModule,
} from "./my-courses/my-courses.module"
import {
    MyLearnedLessonsSingleQueryModule,
} from "./my-learned-lessons/my-learned-lessons.module"
import {
    MyInProgressChallengesSingleQueryModule,
} from "./my-in-progress-challenges/my-in-progress-challenges.module"
import {
    MyWeeklyStatsSingleQueryModule,
} from "./my-weekly-stats/my-weekly-stats.module"
import {
    MyKpisSingleQueryModule,
} from "./my-kpis/my-kpis.module"
import {
    MyContributionCalendarSingleQueryModule,
} from "./my-contribution-calendar/my-contribution-calendar.module"
import {
    TrendingContentsSingleQueryModule,
} from "./trending-contents/trending-contents.module"
import {
    MyFeedSingleQueryModule,
} from "./my-feed/my-feed.module"
import {
    ActiveAdvertisementSingleQueryModule,
} from "./active-advertisement/active-advertisement.module"
import {
    ChangelogEntriesSingleQueryModule,
} from "./changelog-entries/changelog-entries.module"
import {
    MyUpcomingLivestreamsSingleQueryModule,
} from "./my-upcoming-livestreams/my-upcoming-livestreams.module"
import {
    WeeklyChallengeSingleQueryModule,
} from "./weekly-challenge/weekly-challenge.module"
import {
    RewardsSingleQueryModule,
} from "./rewards/rewards.module"
import {
    MyRewardWalletSingleQueryModule,
} from "./my-reward-wallet/my-reward-wallet.module"
import {
    MyVouchersSingleQueryModule,
} from "./my-vouchers/my-vouchers.module"
import {
    MyDailyQuestSingleQueryModule,
} from "./my-daily-quest/my-daily-quest.module"
import {
    RecommendedCoursesSingleQueryModule,
} from "./recommended-courses/recommended-courses.module"

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
        MyVouchersSingleQueryModule.register({
            isGlobal: true,
        }),
        MyDailyQuestSingleQueryModule.register({
            isGlobal: true,
        }),
        RecommendedCoursesSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Dashboard query group -- logged-in home leaf queries (one resolver per rail
 * section: courses / learned lessons / in-progress challenges / weekly stats) plus
 * the cursor-paginated feed and the right-rail content (ad banner + changelog).
 */
export class DashboardQueriesModule extends ConfigurableModuleClass {}
