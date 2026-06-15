import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./users.module-definition"
import {
    UserStatsSingleQueryModule,
} from "./user-stats"
import {
    UserProfileSingleQueryModule,
} from "./user-profile"
import {
    UserAchievementsSingleQueryModule,
} from "./user-achievements"
import {
    UserCoursesSingleQueryModule,
} from "./user-courses"
import {
    UserFeedSingleQueryModule,
} from "./user-feed"
import {
    UserContributionCalendarSingleQueryModule,
} from "./user-contribution-calendar"
import {
    UserWeeklyStatsSingleQueryModule,
} from "./user-weekly-stats"
import {
    UserCodingProgressSingleQueryModule,
} from "./user-coding-progress"
import {
    UserCapstoneTasksSingleQueryModule,
} from "./user-capstone-tasks"
import {
    UserCodingSkillsSingleQueryModule,
} from "./user-coding-skills"
import {
    OpenToWorkUsersSingleQueryModule,
} from "./open-to-work-users"
import {
    UserCodingHistorySingleQueryModule,
} from "./user-coding-history"
import {
    UserSolvedChallengesSingleQueryModule,
} from "./user-solved-challenges"

/**
 * User query group — resolved fields layered onto the shared `UserEntity`
 * GraphQL type (follower / following counts) plus the public profile queries:
 * the profile header (`userProfile`) and the profile tabs / stats — achievements,
 * joined courses, the activity timeline, the contribution calendar, the weekly
 * streak, and coding progress — all keyed by user id.
 */
@Module({
    imports: [
        UserStatsSingleQueryModule.register({
            isGlobal: true,
        }),
        UserProfileSingleQueryModule.register({
            isGlobal: true,
        }),
        UserAchievementsSingleQueryModule.register({
            isGlobal: true,
        }),
        UserCoursesSingleQueryModule.register({
            isGlobal: true,
        }),
        UserFeedSingleQueryModule.register({
            isGlobal: true,
        }),
        UserContributionCalendarSingleQueryModule.register({
            isGlobal: true,
        }),
        UserWeeklyStatsSingleQueryModule.register({
            isGlobal: true,
        }),
        UserCodingProgressSingleQueryModule.register({
            isGlobal: true,
        }),
        UserCapstoneTasksSingleQueryModule.register({
            isGlobal: true,
        }),
        UserCodingSkillsSingleQueryModule.register({
            isGlobal: true,
        }),
        OpenToWorkUsersSingleQueryModule.register({
            isGlobal: true,
        }),
        UserCodingHistorySingleQueryModule.register({
            isGlobal: true,
        }),
        UserSolvedChallengesSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class UsersQueriesModule extends ConfigurableModuleClass {}
