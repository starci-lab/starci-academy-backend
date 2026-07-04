import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./score-uploaded-cv.module-definition"
import {
    ScoreUploadedCvWorker,
} from "./score-uploaded-cv.worker"
import {
    EnqueueScoreUploadedCvJobService,
} from "./enqueue-score-uploaded-cv.service"

/**
 * WF-07 UPLOAD-scoring processor module. Provides the single-step worker (which
 * scores an uploaded `cv_generations` row via the shared `ScoreUploadedCvService`,
 * injected from the globally-registered `GenerateCvModule`) + the enqueue service.
 *
 * `EnqueueScoreUploadedCvJobService` is EXPORTED so the `uploadCv` GraphQL mutation
 * module can inject it after this module is registered global at app root.
 * The BullMQ queue (`BullQueueName.ScoreUploadedCv`) is auto-registered globally
 * by `BullModule.forRoot`, so no manual queue registration is needed here.
 */
@Module({
    providers: [
        ScoreUploadedCvWorker,
        EnqueueScoreUploadedCvJobService,
    ],
    exports: [
        EnqueueScoreUploadedCvJobService,
    ],
})
export class ScoreUploadedCvModule extends ConfigurableModuleClass {}
