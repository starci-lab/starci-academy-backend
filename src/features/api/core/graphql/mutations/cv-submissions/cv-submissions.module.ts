import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cv-submissions.module-definition"
import {
    GenerateSubmitCvPresignUrlSingleMutationModule,
} from "./generate-submit-cv-presign-url"
import {
    VerifySubmitCvPresignUrlSingleMutationModule,
} from "./verify-submit-cv-presign-url"
import {
    GenerateCvSingleMutationModule,
} from "./generate-cv"
import {
    ReviseCvSingleMutationModule,
} from "./revise-cv"
import {
    UploadCvSingleMutationModule,
} from "./upload-cv"

@Module({
    imports: [
        GenerateSubmitCvPresignUrlSingleMutationModule.register({
            isGlobal: true,
        }),
        VerifySubmitCvPresignUrlSingleMutationModule.register({
            isGlobal: true,
        }),
        GenerateCvSingleMutationModule.register({
            isGlobal: true,
        }),
        ReviseCvSingleMutationModule.register({
            isGlobal: true,
        }),
        UploadCvSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class CvSubmissionsMutationsModule extends ConfigurableModuleClass {}
