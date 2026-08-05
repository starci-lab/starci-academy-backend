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
    ProcessVideoInitStepService,
    ProcessVideoEncodeStepService,
    ProcessVideoPackageStepService,
    ProcessVideoUploadStepService,
    ProcessVideoFinalizeStepService,
} from "./steps"

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
