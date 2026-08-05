import {
    Module,
    DynamicModule,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./video-encoder.module-definition"
import {
    ProcessorsModule,
} from "./processors"

@Module({
})
/**
 * Video-encoder feature root. `useProcessors` is opt-in because only the core
 * API process should consume the queue -- CLI/tools/mock must not start ffmpeg.
 */
export class VideoEncoderModule extends ConfigurableModuleClass { 
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            module: VideoEncoderModule,
            imports: [
                ...(dynamicModule.imports ?? []),
                ...(
                    options.useProcessors ? [
                        ProcessorsModule.register({
                            isGlobal: options.isGlobal,
                        })
                    ] : []
                ),
            ],
            exports: [
                ...(dynamicModule.exports ?? []),
            ],
        }
    }   
}
