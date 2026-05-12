import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./presigned-url.module-definition"
import {
    PresignedUrlController,
} from "./presigned-url.controller"
import {
    PresignedUrlService,
} from "./presigned-url.service"
import {
    PresignedUrlHandler,
} from "./presigned-url.handler"

/**
 * Module for admin presigned URL generation.
 */
@Module({
    controllers: [
        PresignedUrlController,
    ],
    providers: [
        PresignedUrlService,
        PresignedUrlHandler,
    ],
})
export class PresignedUrlModule extends ConfigurableModuleClass {}
