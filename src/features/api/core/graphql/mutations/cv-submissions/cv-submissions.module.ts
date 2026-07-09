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
import {
    CreateCvBlocksSingleMutationModule,
} from "./create-cv-blocks"
import {
    UpdateCvBlocksSingleMutationModule,
} from "./update-cv-blocks"
import {
    DeleteCvBlocksSingleMutationModule,
} from "./delete-cv-blocks"
import {
    SplitCvFromTextSingleMutationModule,
} from "./split-cv-from-text"
import {
    RewriteCvBlockSingleMutationModule,
} from "./rewrite-cv-block"
import {
    RenderCvBlocksSingleMutationModule,
} from "./render-cv-blocks"
import {
    TailorCvBlocksSingleMutationModule,
} from "./tailor-cv-blocks"
import {
    ExtractDocumentTextSingleMutationModule,
} from "./extract-document-text"

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
        CreateCvBlocksSingleMutationModule.register({
            isGlobal: true,
        }),
        UpdateCvBlocksSingleMutationModule.register({
            isGlobal: true,
        }),
        DeleteCvBlocksSingleMutationModule.register({
            isGlobal: true,
        }),
        SplitCvFromTextSingleMutationModule.register({
            isGlobal: true,
        }),
        RewriteCvBlockSingleMutationModule.register({
            isGlobal: true,
        }),
        RenderCvBlocksSingleMutationModule.register({
            isGlobal: true,
        }),
        TailorCvBlocksSingleMutationModule.register({
            isGlobal: true,
        }),
        ExtractDocumentTextSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class CvSubmissionsMutationsModule extends ConfigurableModuleClass {}
