import {
    Module,
} from "@nestjs/common"
import {
    S3Module,
} from "@modules/s3"
import {
    MixinModule,
} from "@modules/mixin"
import {
    ConfigurableModuleClass 
} from "./cv-submissions.module-definition"
import {
    SubmitCvSinglePresignedUrlModule 
} from "./submit-cv-presigned-url/submit-cv-presigned-url.module"

/**
 * Module for CV submission related queries.
 */
@Module({
    imports: [
        S3Module,
        MixinModule,
        SubmitCvSinglePresignedUrlModule.register({
            isGlobal: true
        })
        ,
    ],

})
export class CvSubmissionsQueriesModule extends ConfigurableModuleClass {}
