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

@Module({
    providers: [
        SubmissionAttemptsService,
        SubmissionAttemptsResolver,
    ],
})
export class SubmissionAttemptsModule extends ConfigurableModuleClass {}
