import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./submission-attempts.module-definition"
import {
    SubmissionAttemptsResolver,
} from "./submission-attempts.resolver"
import {
    SubmissionAttemptsService,
} from "./submission-attempts.service"
import {
    SubmissionAttemptsHandler,
} from "./submission-attempts.handler"

@Module({
    providers: [
        SubmissionAttemptsService,
        SubmissionAttemptsResolver,
        SubmissionAttemptsHandler,
    ],
})
export class SubmissionAttemptsModule extends ConfigurableModuleClass {}
