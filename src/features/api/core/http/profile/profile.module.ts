import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./profile.module-definition"
import {
    UploadAvatarModule,
} from "./upload-avatar"

/**
 * Profile HTTP module (authenticated multipart avatar upload).
 */
@Module({
    imports: [
        UploadAvatarModule.register({
            isGlobal: true,
        }),
    ],
})
export class ProfileHttpModule extends ConfigurableModuleClass {}
