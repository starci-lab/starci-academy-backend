import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./verify-avatar-presign-url.module-definition"
import {
    VerifyAvatarPresignUrlResolver,
} from "./verify-avatar-presign-url.resolver"
import {
    VerifyAvatarPresignUrlService,
} from "./verify-avatar-presign-url.service"
import {
    VerifyAvatarPresignUrlHandler,
} from "./verify-avatar-presign-url.handler"

@Module({
    providers: [
        VerifyAvatarPresignUrlResolver,
        VerifyAvatarPresignUrlService,
        VerifyAvatarPresignUrlHandler,
    ],
})
export class VerifyAvatarPresignUrlSingleMutationModule extends ConfigurableModuleClass {}
