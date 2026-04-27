import {
    Module,
} from "@nestjs/common"
import {
    TriggerCvSubmissionMutationModule,
} from "./trigger-cv-submission"

@Module({
    imports: [
        TriggerCvSubmissionMutationModule,
    ],
})
export class CvSubmissionsMutationsModule {}