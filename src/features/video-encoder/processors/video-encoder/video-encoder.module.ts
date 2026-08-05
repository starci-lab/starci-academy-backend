import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./video-encoder.module-definition"
import {
    VideoEncoderWorker
} from "./video-encoder.worker"
import {
    StepMappingService
} from "./step-mapping.service"
import {
    ProcessVideoEncodeStepService,
} from "./steps/process-video-encode-step.service"
import {
    ProcessVideoFinalizeStepService,
} from "./steps/process-video-finalize-step.service"
import {
    ProcessVideoInitStepService,
} from "./steps/process-video-init-step.service"
import {
    ProcessVideoPackageStepService,
} from "./steps/process-video-package-step.service"
import {
    ProcessVideoUploadStepService,
} from "./steps/process-video-upload-step.service"

@Module({
    providers: [
        VideoEncoderWorker,
        StepMappingService,
        ProcessVideoInitStepService,
        ProcessVideoEncodeStepService,
        ProcessVideoPackageStepService,
        ProcessVideoUploadStepService,
        ProcessVideoFinalizeStepService,
    ],
})
/**
 * Registers the ProcessVideo worker and its step map. Split from
 * `VideoEncoderModule` so an app can load encoder config without starting the
 * ffmpeg consumer.
 */
export class VideoEncoderProcessorsModule extends ConfigurableModuleClass { }
