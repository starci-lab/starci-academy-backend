import {
    Module,
} from "@nestjs/common"
import {
    GetSubmitCvPresignedUrlResolver,
} from "./get-submit-cv-presigned-url/get-submit-cv-presigned-url.resolver"
import {
    GetSubmitCvPresignedUrlService,
} from "./get-submit-cv-presigned-url/get-submit-cv-presigned-url.service"
import {
    S3Module,
} from "@modules/s3"
import {
    MixinModule,
} from "@modules/mixin"
import {
    ConfigurableModuleClass 
} from "./cv-submissions.module-definition"

/**
 * Module for CV submission related queries.
 */
@Module({
    imports: [
        S3Module,
        MixinModule,
    ],
    providers: [
        GetSubmitCvPresignedUrlResolver,
        GetSubmitCvPresignedUrlService,
    ],
    exports: [
        GetSubmitCvPresignedUrlService,
    ],
})
export class CvSubmissionsQueriesModule extends ConfigurableModuleClass {}
