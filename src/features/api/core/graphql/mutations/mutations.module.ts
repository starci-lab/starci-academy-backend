import {
    Module,
} from "@nestjs/common"
import {
    AuthenticationMutationsModule,
} from "./authentication"
import {
    ChallengeSubmissionsMutationsModule,
} from "./challenge-submissions"
import {
    CvSubmissionsMutationsModule,
} from "./cv-submissions"
import {
    CoursesMutationsModule,
} from "./courses"
import {
    ContentsMutationModule,
} from "./contents"
import {
    ConfigurableModuleClass,
} from "./mutations.module-definition"
import {
    KeycloakMutationsModule,
} from "./keycloak"
import {
    PersonalProjectMutationsModule,
} from "./personal-project"
import {
    AiMutationsModule,
} from "./ai"
import {
    CodingMutationsModule,
} from "./coding"
import {
    DiscussionMutationsModule,
} from "./discussion"
import {
    InterviewMutationsModule,
} from "./interview"
import {
    MembershipMutationsModule,
} from "./membership"
import {
    FollowsMutationsModule,
} from "./follows"
import {
    ProfileMutationsModule,
} from "./profile"
import {
    TwoFactorMutationsModule,
} from "./two-factor"
import {
    NotificationsMutationsModule,
} from "./notifications"
import {
    RewardsMutationsModule,
} from "./rewards"
import {
    FlashcardMutationsModule,
} from "./flashcard"
import {
    ContactMutationsModule,
} from "./contact"
import {
    CommunityMutationsModule,
} from "./community"
import {
    ChatMutationsModule,
} from "./chat"
import {
    RagPlaygroundMutationsModule,
} from "./rag-playground"
import {
    JobPostingsMutationsModule,
} from "./job-postings"
import {
    InstallmentPlansMutationsModule,
} from "./installment-plans"
import {
    PlaygroundSessionsMutationsModule,
} from "./playground-sessions"
import {
    StreakMutationsModule,
} from "./streak"

/**
 * GraphQL mutations (courses, authentication, etc.).
 */
@Module({
    imports: [
        ContactMutationsModule.register({
            isGlobal: true,
        }),
        AuthenticationMutationsModule.register({
            isGlobal: true,
        }),
        KeycloakMutationsModule.register({
            isGlobal: true,
        }),
        CoursesMutationsModule.register({
            isGlobal: true,
        }),
        ChallengeSubmissionsMutationsModule.register({
            isGlobal: true,
        }),
        CvSubmissionsMutationsModule,
        ContentsMutationModule.register({
            isGlobal: true,
        }),
        PersonalProjectMutationsModule.register({
            isGlobal: true,
        }),
        AiMutationsModule.register({
            isGlobal: true,
        }),
        CodingMutationsModule.register({
            isGlobal: true,
        }),
        DiscussionMutationsModule.register({
            isGlobal: true,
        }),
        InterviewMutationsModule.register({
            isGlobal: true,
        }),
        MembershipMutationsModule.register({
            isGlobal: true,
        }),
        FollowsMutationsModule.register({
            isGlobal: true,
        }),
        ProfileMutationsModule.register({
            isGlobal: true,
        }),
        TwoFactorMutationsModule.register({
            isGlobal: true,
        }),
        NotificationsMutationsModule.register({
            isGlobal: true,
        }),
        RewardsMutationsModule.register({
            isGlobal: true,
        }),
        FlashcardMutationsModule.register({
            isGlobal: true,
        }),
        CommunityMutationsModule.register({
            isGlobal: true,
        }),
        ChatMutationsModule.register({
            isGlobal: true,
        }),
        RagPlaygroundMutationsModule.register({
            isGlobal: true,
        }),
        JobPostingsMutationsModule.register({
            isGlobal: true,
        }),
        InstallmentPlansMutationsModule.register({
            isGlobal: true,
        }),
        PlaygroundSessionsMutationsModule.register({
            isGlobal: true,
        }),
        StreakMutationsModule.register({
            isGlobal: true,
        }),
    ],
})
export class MutationsModule extends ConfigurableModuleClass { }
