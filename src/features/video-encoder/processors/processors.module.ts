import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass, 
} from "./processors.module-definition"
import {
    VideoEncoderProcessorsModule 
} from "./video-encoder"

@Module({
    imports: [
        VideoEncoderProcessorsModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Opt-in Bull consumer for ProcessVideo. Kept behind
 * `VideoEncoderModule.register({ useProcessors })` so CLI/tools/mock can import
 * encoder wiring without spawning ffmpeg workers.
 */
export class ProcessorsModule extends ConfigurableModuleClass { 
}
