import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./queries.module-definition"
import {
    AuthenticationQueriesModule,
} from "./authentication/authentication.module"
import {
    CoursesQueriesModule,
} from "./courses/courses.module"
import {
    ContentsModule,
} from "./contents/contents.module"
import {
    ChallengesModule,
} from "./challenges/challenges.module"
import {
    ModulesModule,
} from "./modules/modules.module"
import {
    ChallengeSubmissionsModule,
} from "./challenge-submissions/challenge-submissions.module"
import {
    CvSubmissionsQueriesModule,
} from "./cv-submissions/cv-submissions.module"
import {
    JobsModule,
} from "./jobs/jobs.module"
import {
    SystemModule,
} from "./system/system.module"
import {
    ValidationsModule,
} from "./validations/validations.module"
import {
    AutocompleteQueriesModule,
} from "./autocomplete/autocomplete.module"
import {
    TasksQueriesModule,
} from "./tasks/tasks.module"
import {
    PersonalProjectQueriesModule,
} from "./personal-project/personal-project.module"
import {
    MilestonesModule,
} from "./milestones/milestones.module"
import {
    FoundationsModule,
} from "./foundations/foundations.module"
import {
    HeadhuntingsModule,
} from "./headhuntings/headhuntings.module"
import {
    JobPostingsModule,
} from "./job-postings/job-postings.module"
import {
    AiQueriesModule,
} from "./ai/ai.module"
import {
    FlashcardDecksQueriesModule,
} from "./flashcard-decks/flashcard-decks.module"
import {
    FlashcardQueriesModule,
} from "./flashcard/flashcard.module"
import {
    CodingQueriesModule,
} from "./coding/coding.module"
import {
    DiscussionQueriesModule,
} from "./discussion/discussion.module"
import {
    SessionsQueriesModule,
} from "./sessions/sessions.module"
import {
    DashboardQueriesModule,
} from "./dashboard/dashboard.module"
import {
    LeagueQueriesModule,
} from "./league/league.module"
import {
    AchievementsQueriesModule,
} from "./achievements/achievements.module"
import {
    UsersQueriesModule,
} from "./users/users.module"
import {
    NotificationsQueriesModule,
} from "./notifications/notifications.module"
import {
    LearnerCmsQueriesModule,
} from "./learner-cms/learner-cms.module"
import {
    BlogQueriesModule,
} from "./blog/blog.module"
import {
    CommunityQueriesModule,
} from "./community/community.module"
import {
    ChatQueriesModule,
} from "./chat/chat.module"
import {
    InstallmentPlansQueriesModule,
} from "./installment-plans/installment-plans.module"
import {
    SearchCourseContentQueriesModule,
} from "./search-course-content/search-course-content.module"
import {
    PlaygroundsQueriesModule,
} from "./playgrounds/playgrounds.module"
import {
    RagPlaygroundQueriesModule,
} from "./rag-playground/rag-playground.module"
import {
    ProSubscriptionQueriesModule,
} from "./pro-subscription/pro-subscription.module"
import {
    ConceptsQueriesModule,
} from "./concepts/concepts.module"

@Module({
    imports: [
        ProSubscriptionQueriesModule,
        ConceptsQueriesModule.register({
            isGlobal: true,
        }),
        AuthenticationQueriesModule.register({
            isGlobal: true,
        }),
        CoursesQueriesModule.register({
            isGlobal: true,
        }),
        ContentsModule.register({
            isGlobal: true,
        }),
        ChallengesModule.register({
            isGlobal: true,
        }),
        ModulesModule.register({
            isGlobal: true,
        }),
        ChallengeSubmissionsModule.register({
            isGlobal: true,
        }),
        CvSubmissionsQueriesModule.register({
            isGlobal: true
        }),
        JobsModule.register({
            isGlobal: true,
        }),
        SystemModule.register({
            isGlobal: true,
        }),
        ValidationsModule.register({
            isGlobal: true,
        }),
        AutocompleteQueriesModule.register({
            isGlobal: true,
        }),
        TasksQueriesModule.register({
            isGlobal: true,
        }),
        PersonalProjectQueriesModule.register({
            isGlobal: true,
        }),
        MilestonesModule.register({
            isGlobal: true,
        }),
        FoundationsModule.register({
            isGlobal: true,
        }),
        HeadhuntingsModule.register({
            isGlobal: true,
        }),
        JobPostingsModule.register({
            isGlobal: true,
        }),
        AiQueriesModule.register({
            isGlobal: true,
        }),
        FlashcardDecksQueriesModule.register({
            isGlobal: true,
        }),
        FlashcardQueriesModule.register({
            isGlobal: true,
        }),
        CodingQueriesModule.register({
            isGlobal: true,
        }),
        DiscussionQueriesModule.register({
            isGlobal: true,
        }),
        SessionsQueriesModule.register({
            isGlobal: true,
        }),
        DashboardQueriesModule.register({
            isGlobal: true,
        }),
        LeagueQueriesModule.register({
            isGlobal: true,
        }),
        AchievementsQueriesModule.register({
            isGlobal: true,
        }),
        UsersQueriesModule.register({
            isGlobal: true,
        }),
        NotificationsQueriesModule.register({
            isGlobal: true,
        }),
        LearnerCmsQueriesModule.register({
            isGlobal: true,
        }),
        BlogQueriesModule.register({
            isGlobal: true,
        }),
        CommunityQueriesModule.register({
            isGlobal: true,
        }),
        ChatQueriesModule.register({
            isGlobal: true,
        }),
        InstallmentPlansQueriesModule.register({
            isGlobal: true,
        }),
        SearchCourseContentQueriesModule.register({
            isGlobal: true,
        }),
        PlaygroundsQueriesModule.register({
            isGlobal: true,
        }),
        RagPlaygroundQueriesModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Root GraphQL query aggregator -- registers every domain query group as
 * global so a single import at the API feature root exposes the full read
 * surface. Mutations live in a sibling module, not here.
 */
export class QueriesModule extends ConfigurableModuleClass {}
