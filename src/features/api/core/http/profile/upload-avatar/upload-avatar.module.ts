import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./upload-avatar.module-definition"
import {
    UploadAvatarController,
} from "./upload-avatar.controller"
import {
    UploadAvatarService,
} from "./upload-avatar.service"

/**
 * Module for the authenticated avatar-upload endpoint.
 */
@Module({
    controllers: [
        UploadAvatarController,
    ],
    providers: [
        UploadAvatarService,
    ],
})
export class UploadAvatarModule extends ConfigurableModuleClass {}
