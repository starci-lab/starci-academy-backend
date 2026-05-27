import {
    ConfigurableModuleClass,
} from "./trigger-cv-submission.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    TriggerCvSubmissionResolver,
} from "./trigger-cv-submission.resolver"
import {
    TriggerCvSubmissionService,
} from "./trigger-cv-submission.service"
import {
    TriggerCvSubmissionHandler,
} from "./trigger-cv-submission.handler"

@Module({
    providers: [
        TriggerCvSubmissionResolver,
        TriggerCvSubmissionService,
        TriggerCvSubmissionHandler,
    ],
})
export class TriggerCvSubmissionSingleMutationModule extends ConfigurableModuleClass {}
