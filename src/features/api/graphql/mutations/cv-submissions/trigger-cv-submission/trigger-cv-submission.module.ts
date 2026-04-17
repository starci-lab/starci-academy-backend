import {
    Module,
} from "@nestjs/common"
import {
    TriggerCvSubmissionResolver,
} from "./trigger-cv-submission.resolver"
import {
    TriggerCvSubmissionService,
} from "./trigger-cv-submission.service"

@Module({
    providers: [
        TriggerCvSubmissionResolver,
        TriggerCvSubmissionService,
    ],
})
export class TriggerCvSubmissionMutationModule {}