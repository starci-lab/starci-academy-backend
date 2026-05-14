import {
    Module,
} from "@nestjs/common"
import {
    S3Module,
} from "@modules/s3"
import {
    ConfigurableModuleClass,
} from "./user-cv-submission-attempts.module-definition"
import {
    UserCvSubmissionAttemptsResolver,
} from "./user-cv-submission-attempts.resolver"
import {
    UserCvSubmissionAttemptsService,
} from "./user-cv-submission-attempts.service"
import {
    UserCvSubmissionAttemptsHandler,
} from "./user-cv-submission-attempts.handler"

@Module({
    imports: [
        S3Module,
    ],
    providers: [
        UserCvSubmissionAttemptsResolver,
        UserCvSubmissionAttemptsService,
        UserCvSubmissionAttemptsHandler,
    ],
})
export class UserCvSubmissionAttemptsModule extends ConfigurableModuleClass {}
