import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./ffmpeg.module-definition"
import { FfmpegService } from "./ffmpeg.service"

@Module({
    providers: [FfmpegService],
    exports: [FfmpegService],
})
export class FfmpegModule extends ConfigurableModuleClass {}
