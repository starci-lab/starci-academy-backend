import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./queries.module-definition"
import {
    AuthenticationQueriesModule,
} from "./authentication"
import {
    CoursesQueriesModule,
} from "./courses"
import {
    ContentsModule,
} from "./contents"
import {
    ChallengesModule,
} from "./challenges"
import {
    ModulesModule,
} from "./modules"
import {
    ChallengeSubmissionsModule,
} from "./challenge-submissions"
import {
    CvSubmissionsQueriesModule,
} from "./cv-submissions/cv-submissions.module"
import {
    JobsModule,
} from "./jobs"
import {
    SystemModule,
} from "./system"
import {
    ValidationsModule,
} from "./validations"
import {
    AutocompleteQueriesModule,
} from "./autocomplete"
import {
    TasksQueriesModule,
} from "./tasks"
import {
    PersonalProjectQueriesModule,
} from "./personal-project"
import {
    MilestonesModule,
} from "./milestones"
import {
    FoundationsModule,
} from "./foundations"
import {
    HeadhuntingsModule,
} from "./headhuntings"
import {
    JobPostingsModule,
} from "./job-postings"
import {
    AiQueriesModule,
} from "./ai"
import {
    FlashcardDecksQueriesModule,
} from "./flashcard-decks"
import {
    FlashcardQueriesModule,
} from "./flashcard"
import {
    CodingQueriesModule,
} from "./coding"
import {
    DiscussionQueriesModule,
} from "./discussion"
import {
    SessionsQueriesModule,
} from "./sessions"
import {
    DashboardQueriesModule,
} from "./dashboard"
import {
    LeagueQueriesModule,
} from "./league"
import {
    AchievementsQueriesModule,
} from "./achievements"
import {
    UsersQueriesModule,
} from "./users"
import {
    NotificationsQueriesModule,
} from "./notifications"
import {
    LearnerCmsQueriesModule,
} from "./learner-cms"
import {
    BlogQueriesModule,
} from "./blog"
import {
    CommunityQueriesModule,
} from "./community"
import {
    ChatQueriesModule,
} from "./chat"
import {
    InstallmentPlansQueriesModule,
} from "./installment-plans"
import {
    SearchCourseContentQueriesModule,
} from "./search-course-content"
import {
    PlaygroundsQueriesModule,
} from "./playgrounds"
import {
    RagPlaygroundQueriesModule,
} from "./rag-playground"

@Module({
    imports: [
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
export class QueriesModule extends ConfigurableModuleClass {}
