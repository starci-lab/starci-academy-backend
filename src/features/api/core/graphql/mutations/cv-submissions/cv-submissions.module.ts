import {
    Module,
} from "@nestjs/common"
import {
    TriggerCvSubmissionMutationModule,
} from "./trigger-cv-submission"
import {
    ReviewCvMutationModule,
} from "./review-cv"
import {
    GenerateSubmitCvPresignUrlModule,
} from "./generate-submit-cv-presign-url"
import {
    VerifySubmitCvPresignUrlModule,
} from "./verify-submit-cv-presign-url"

@Module({
    imports: [
        TriggerCvSubmissionMutationModule,
        ReviewCvMutationModule,
        GenerateSubmitCvPresignUrlModule.register({
            isGlobal: true,
        }),
        VerifySubmitCvPresignUrlModule.register({
            isGlobal: true,
        }),
    ],
})
export class CvSubmissionsMutationsModule {}