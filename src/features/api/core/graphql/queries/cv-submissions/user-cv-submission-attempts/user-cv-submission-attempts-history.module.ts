import {
    Module,
} from "@nestjs/common"
import {
    S3Module,
} from "@modules/s3"
import {
    ConfigurableModuleClass,
} from "./user-cv-submission-attempts-history.module-definition"
import {
    UserCvSubmissionAttemptsHistoryResolver,
} from "./user-cv-submission-attempts-history.resolver"
import {
    UserCvSubmissionAttemptsHistoryService,
} from "./user-cv-submission-attempts-history.service"
import {
    UserCvSubmissionAttemptsHistoryHandler,
} from "./user-cv-submission-attempts-history.handler"

@Module({
    imports: [
        S3Module,
    ],
    providers: [
        UserCvSubmissionAttemptsHistoryResolver,
        UserCvSubmissionAttemptsHistoryService,
        UserCvSubmissionAttemptsHistoryHandler,
    ],
})
export class UserCvSubmissionAttemptsHistoryModule extends ConfigurableModuleClass {}
