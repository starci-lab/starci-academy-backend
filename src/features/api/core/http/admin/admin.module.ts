import {
    Module,
} from "@nestjs/common"
import {
    PresignedUrlModule,
} from "./presigned-url/presigned-url.module"
import {
    ProcessVideoModule,
} from "./process-video/process-video.module"
import {
    ViewPresignedUrlModule,
} from "./view-presigned-url/view-presigned-url.module"
import {
    ConfigurableModuleClass 
} from "./admin.module-definition"

@Module({
    imports: [
        PresignedUrlModule.register({
            isGlobal: true,
        }),
        ProcessVideoModule.register({
            isGlobal: true,
        }),
        ViewPresignedUrlModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Module for Admin API.
 */
export class AdminModule extends ConfigurableModuleClass { }

