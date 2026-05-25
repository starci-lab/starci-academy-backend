import {
    Module,
} from "@nestjs/common"
import {
    PresignedUrlModule 
} from "./presigned-url"
import {
    ProcessVideoModule 
} from "./process-video"
import {
    ViewPresignedUrlModule 
} from "./view-presigned-url"
import {
    ConfigurableModuleClass 
} from "./admin.module-definition"

/**
 * Module for Admin API.
 */
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
export class AdminModule extends ConfigurableModuleClass { }

