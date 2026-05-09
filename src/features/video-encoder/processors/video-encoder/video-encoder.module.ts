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
export class VideoEncoderProcessorsModule extends ConfigurableModuleClass { }
