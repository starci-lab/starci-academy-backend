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
    MyContributionCalendarSingleQueryModule,
} from "./my-contribution-calendar"
import {
    MyFeedSingleQueryModule,
} from "./my-feed"
import {
    ActiveAdvertisementSingleQueryModule,
} from "./active-advertisement"
import {
    ChangelogEntriesSingleQueryModule,
} from "./changelog-entries"

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
        MyContributionCalendarSingleQueryModule.register({
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
    ],
})
export class DashboardQueriesModule extends ConfigurableModuleClass {}
