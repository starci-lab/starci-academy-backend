import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    UploadCvResolver,
} from "./upload-cv.resolver"
import {
    UploadCvService,
} from "./upload-cv.service"
import {
    UploadCvHandler,
} from "./upload-cv.handler"
import {
    ConfigurableModuleClass,
} from "./upload-cv.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        UploadCvResolver,
        UploadCvService,
        UploadCvHandler,
    ],
    exports: [
        UploadCvService,
    ],
})
/**
 * WF-07 `uploadCv` mutation module. Creates the uploaded `cv_generations` row
 * (`source = uploaded`) + enqueues async scoring.
 *
 * `EnqueueScoreUploadedCvJobService` (injected by the handler) is provided by the
 * globally-registered `ScoreUploadedCvModule` (app root), so no processor import
 * is needed here.
 */
export class UploadCvSingleMutationModule extends ConfigurableModuleClass {}
