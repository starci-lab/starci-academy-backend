import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./users.module-definition"
import {
    UserStatsSingleQueryModule,
} from "./user-stats/user-stats.module"
import {
    UserProfileSingleQueryModule,
} from "./user-profile/user-profile.module"
import {
    UserAchievementsSingleQueryModule,
} from "./user-achievements/user-achievements.module"
import {
    UserCoursesSingleQueryModule,
} from "./user-courses/user-courses.module"
import {
    UserFeedSingleQueryModule,
} from "./user-feed/user-feed.module"
import {
    UserContributionCalendarSingleQueryModule,
} from "./user-contribution-calendar/user-contribution-calendar.module"
import {
    UserWeeklyStatsSingleQueryModule,
} from "./user-weekly-stats/user-weekly-stats.module"
import {
    UserCodingProgressSingleQueryModule,
} from "./user-coding-progress/user-coding-progress.module"
import {
    UserCapstoneTasksSingleQueryModule,
} from "./user-capstone-tasks/user-capstone-tasks.module"
import {
    UserCapstoneProgressSingleQueryModule,
} from "./user-capstone-progress/user-capstone-progress.module"
import {
    UserCodingSkillsSingleQueryModule,
} from "./user-coding-skills/user-coding-skills.module"
import {
    OpenToWorkUsersSingleQueryModule,
} from "./open-to-work-users/open-to-work-users.module"
import {
    UserCodingHistorySingleQueryModule,
} from "./user-coding-history/user-coding-history.module"
import {
    UserCodingRankSingleQueryModule,
} from "./user-coding-rank/user-coding-rank.module"
import {
    UserXpSingleQueryModule,
} from "./user-xp/user-xp.module"
import {
    UserSolvedChallengesSingleQueryModule,
} from "./user-solved-challenges/user-solved-challenges.module"
import {
    UserSolvedChallengeDetailSingleQueryModule,
} from "./user-solved-challenge-detail/user-solved-challenge-detail.module"
import {
    UserCodingProblemDetailSingleQueryModule,
} from "./user-coding-problem-detail/user-coding-problem-detail.module"
import {
    UserChallengeStrengthSingleQueryModule,
} from "./user-challenge-strength/user-challenge-strength.module"
import {
    SuggestedUsersSingleQueryModule,
} from "./suggested-users/suggested-users.module"
import {
    SearchUsersSingleQueryModule,
} from "./search-users/search-users.module"
import {
    UserPinnedProjectsSingleQueryModule,
} from "./user-pinned-projects/user-pinned-projects.module"
import {
    MyPinnableCapstonesSingleQueryModule,
} from "./my-pinnable-capstones/my-pinnable-capstones.module"
import {
    UserFollowersSingleQueryModule,
} from "./user-followers/user-followers.module"
import {
    UserFollowingSingleQueryModule,
} from "./user-following/user-following.module"
import {
    CourseLearningHistorySingleQueryModule,
} from "./course-learning-history/course-learning-history.module"
import {
    JobReadinessQueriesModule,
} from "./job-readiness/job-readiness.module"
import {
    TalentCandidatesSingleQueryModule,
} from "./talent-candidates/talent-candidates.module"

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
        UserSolvedChallengeDetailSingleQueryModule.register({
            isGlobal: true,
        }),
        UserCodingProblemDetailSingleQueryModule.register({
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
        TalentCandidatesSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * User query group -- resolved fields layered onto the shared `UserEntity`
 * GraphQL type (follower / following counts) plus the public profile queries:
 * the profile header (`userProfile`) and the profile tabs / stats -- achievements,
 * joined courses, the activity timeline, the contribution calendar, the weekly
 * streak, and coding progress -- all keyed by user id.
 */
export class UsersQueriesModule extends ConfigurableModuleClass {}
