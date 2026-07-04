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
    UserCapstoneProgressSingleQueryModule,
} from "./user-capstone-progress"
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
    UserCodingRankSingleQueryModule,
} from "./user-coding-rank"
import {
    UserXpSingleQueryModule,
} from "./user-xp"
import {
    UserSolvedChallengesSingleQueryModule,
} from "./user-solved-challenges"
import {
    UserChallengeStrengthSingleQueryModule,
} from "./user-challenge-strength"
import {
    SuggestedUsersSingleQueryModule,
} from "./suggested-users"
import {
    SearchUsersSingleQueryModule,
} from "./search-users"
import {
    UserPinnedProjectsSingleQueryModule,
} from "./user-pinned-projects"
import {
    MyPinnableCapstonesSingleQueryModule,
} from "./my-pinnable-capstones"
import {
    UserFollowersSingleQueryModule,
} from "./user-followers"
import {
    UserFollowingSingleQueryModule,
} from "./user-following"
import {
    CourseLearningHistorySingleQueryModule,
} from "./course-learning-history"
import {
    JobReadinessQueriesModule,
} from "./job-readiness"

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
        UserCapstoneProgressSingleQueryModule.register({
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
        UserCodingRankSingleQueryModule.register({
            isGlobal: true,
        }),
        UserXpSingleQueryModule.register({
            isGlobal: true,
        }),
        UserSolvedChallengesSingleQueryModule.register({
            isGlobal: true,
        }),
        UserChallengeStrengthSingleQueryModule.register({
            isGlobal: true,
        }),
        SuggestedUsersSingleQueryModule.register({
            isGlobal: true,
        }),
        SearchUsersSingleQueryModule.register({
            isGlobal: true,
        }),
        UserPinnedProjectsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyPinnableCapstonesSingleQueryModule.register({
            isGlobal: true,
        }),
        UserFollowersSingleQueryModule.register({
            isGlobal: true,
        }),
        UserFollowingSingleQueryModule.register({
            isGlobal: true,
        }),
        CourseLearningHistorySingleQueryModule.register({
            isGlobal: true,
        }),
        JobReadinessQueriesModule.register({
            isGlobal: true,
        }),
    ],
})
export class UsersQueriesModule extends ConfigurableModuleClass {}
