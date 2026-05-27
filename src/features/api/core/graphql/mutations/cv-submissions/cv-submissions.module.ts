import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cv-submissions.module-definition"
import {
    TriggerCvSubmissionSingleMutationModule,
} from "./trigger-cv-submission"
import {
    ReviewCvSingleMutationModule,
} from "./review-cv"
import {
    GenerateSubmitCvPresignUrlSingleMutationModule,
} from "./generate-submit-cv-presign-url"
import {
    VerifySubmitCvPresignUrlSingleMutationModule,
} from "./verify-submit-cv-presign-url"

@Module({
    imports: [
        TriggerCvSubmissionSingleMutationModule.register({
            isGlobal: true,
        }),
        ReviewCvSingleMutationModule.register({
            isGlobal: true,
        }),
        GenerateSubmitCvPresignUrlSingleMutationModule.register({
            isGlobal: true,
        }),
        VerifySubmitCvPresignUrlSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class CvSubmissionsMutationsModule extends ConfigurableModuleClass {}