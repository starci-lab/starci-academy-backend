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
/**
 * Wires {@link FfmpegService} + {@link GpuService} so the video worker encodes
 * with NVENC/AMF/QSV when present and falls back to libx264 without each caller
 * probing GPUs itself.
 */
export class FfmpegModule extends ConfigurableModuleClass { }
