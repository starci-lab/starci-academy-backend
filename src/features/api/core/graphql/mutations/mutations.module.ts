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

/**
 * GraphQL mutations (courses, authentication, etc.).
 */
@Module({
    imports: [
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
    ],
})
export class MutationsModule extends ConfigurableModuleClass { }
