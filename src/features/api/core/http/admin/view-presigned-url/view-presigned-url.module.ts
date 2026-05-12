import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./view-presigned-url.module-definition"
import {
    ViewPresignedUrlController,
} from "./view-presigned-url.controller"
import {
    ViewPresignedUrlService,
} from "./view-presigned-url.service"
import {
    ViewPresignedUrlHandler,
} from "./view-presigned-url.handler"

/**
 * Module for admin view presigned URL generation (GET access).
 */
@Module({
    controllers: [
        ViewPresignedUrlController,
    ],
    providers: [
        ViewPresignedUrlService,
        ViewPresignedUrlHandler,
    ],
})
export class ViewPresignedUrlModule extends ConfigurableModuleClass {}
