import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cv-submissions.module-definition"
import {
    GenerateSubmitCvPresignUrlSingleMutationModule,
} from "./generate-submit-cv-presign-url/generate-submit-cv-presign-url.module"
import {
    GenerateCvSingleMutationModule,
} from "./generate-cv/generate-cv.module"
import {
    ReviseCvSingleMutationModule,
} from "./revise-cv/revise-cv.module"
import {
    UploadCvSingleMutationModule,
} from "./upload-cv/upload-cv.module"
import {
    CreateCvBlocksSingleMutationModule,
} from "./create-cv-blocks/create-cv-blocks.module"
import {
    UpdateCvBlocksSingleMutationModule,
} from "./update-cv-blocks/update-cv-blocks.module"
import {
    DeleteCvBlocksSingleMutationModule,
} from "./delete-cv-blocks/delete-cv-blocks.module"
import {
    SplitCvFromTextSingleMutationModule,
} from "./split-cv-from-text/split-cv-from-text.module"
import {
    RewriteCvBlockSingleMutationModule,
} from "./rewrite-cv-block/rewrite-cv-block.module"
import {
    RenderCvBlocksSingleMutationModule,
} from "./render-cv-blocks/render-cv-blocks.module"
import {
    TailorCvBlocksSingleMutationModule,
} from "./tailor-cv-blocks/tailor-cv-blocks.module"
import {
    ExtractDocumentTextSingleMutationModule,
} from "./extract-document-text/extract-document-text.module"

@Module({
    imports: [
        GenerateSubmitCvPresignUrlSingleMutationModule.register({
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
/** Composition root for CV generate, upload, edit, and export writes so the schema picks them up from one import. */
export class CvSubmissionsMutationsModule extends ConfigurableModuleClass {}
