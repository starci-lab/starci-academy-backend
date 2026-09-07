import {
    Module,
} from "@nestjs/common"
import {
    AuthenticationMutationsModule,
} from "./authentication/authentication.module"
import {
    ChallengeSubmissionsMutationsModule,
} from "./challenge-submissions/challenge-submissions.module"
import {
    CvSubmissionsMutationsModule,
} from "./cv-submissions/cv-submissions.module"
import {
    CoursesMutationsModule,
} from "./courses/courses.module"
import {
    ContentsMutationModule,
} from "./contents/contents.module"
import {
    ConfigurableModuleClass,
} from "./mutations.module-definition"
import {
    KeycloakMutationsModule,
} from "./keycloak/keycloak.module"
import {
    PersonalProjectMutationsModule,
} from "./personal-project/personal-project.module"
import {
    AiMutationsModule,
} from "./ai/ai.module"
import {
    CodingMutationsModule,
} from "./coding/coding.module"
import {
    DiscussionMutationsModule,
} from "./discussion/discussion.module"
import {
    InterviewMutationsModule,
} from "./interview/interview.module"
import {
    MembershipMutationsModule,
} from "./membership/membership.module"
import {
    FollowsMutationsModule,
} from "./follows/follows.module"
import {
    ProfileMutationsModule,
} from "./profile/profile.module"
import {
    TwoFactorMutationsModule,
} from "./two-factor/two-factor.module"
import {
    NotificationsMutationsModule,
} from "./notifications/notifications.module"
import {
    RewardsMutationsModule,
} from "./rewards/rewards.module"
import {
    FlashcardMutationsModule,
} from "./flashcard/flashcard.module"
import {
    ContactMutationsModule,
} from "./contact/contact.module"
import {
    CommunityMutationsModule,
} from "./community/community.module"
import {
    ChatMutationsModule,
} from "./chat/chat.module"
import {
    RagPlaygroundMutationsModule,
} from "./rag-playground/rag-playground.module"
import {
    JobPostingsMutationsModule,
} from "./job-postings/job-postings.module"
import {
    InstallmentPlansMutationsModule,
} from "./installment-plans/installment-plans.module"
import {
    PlaygroundSessionsMutationsModule,
} from "./playground-sessions/playground-sessions.module"
import {
    StreakMutationsModule,
} from "./streak/streak.module"
import {
    ProSubscriptionMutationsModule,
} from "./pro-subscription/pro-subscription.module"

/**
 * GraphQL mutations (courses, authentication, etc.).
 */
@Module({
    imports: [
        ProSubscriptionMutationsModule,
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
/**
 * Root write-side composition: every domain mutation group registers here
 * as global so a feature app can import one module instead of each leaf.
 */
export class MutationsModule extends ConfigurableModuleClass { }
