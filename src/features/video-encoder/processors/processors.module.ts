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
export class ProcessorsModule extends ConfigurableModuleClass { 
}
