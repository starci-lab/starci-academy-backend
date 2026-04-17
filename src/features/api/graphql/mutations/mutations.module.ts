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
    ConfigurableModuleClass,
} from "./mutations.module-definition"

/**
 * GraphQL mutations (courses, authentication, etc.).
 */
@Module({
    imports: [
        AuthenticationMutationsModule.register({
            isGlobal: true,
        }),
        CoursesMutationsModule.register({
            isGlobal: true,
        }),
        ChallengeSubmissionsMutationsModule.register({
            isGlobal: true,
        }),
        CvSubmissionsMutationsModule,
    ],
})
export class MutationsModule extends ConfigurableModuleClass {}
