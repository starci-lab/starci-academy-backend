import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ffmpeg.module-definition"
import {
    FfmpegService,
} from "./ffmpeg.service"
import {
    GpuService,
} from "./gpu.service"

@Module({
    providers: [FfmpegService,
        GpuService],
    exports: [FfmpegService,
        GpuService],
})
export class FfmpegModule extends ConfigurableModuleClass { }
