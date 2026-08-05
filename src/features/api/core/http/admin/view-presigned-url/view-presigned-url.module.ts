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

@Module({
    controllers: [
        ViewPresignedUrlController,
    ],
    providers: [
        ViewPresignedUrlService,
        ViewPresignedUrlHandler,
    ],
})
/**
 * Module for admin view presigned URL generation (GET access).
 */
export class ViewPresignedUrlModule extends ConfigurableModuleClass {}
