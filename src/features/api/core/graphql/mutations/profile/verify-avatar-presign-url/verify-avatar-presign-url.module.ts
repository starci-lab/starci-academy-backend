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
/**
 * Registers avatar-upload confirm (resolver + service + handler) separately
 * from presign mint -- verification must see an object that already landed
 * in storage.
 */
export class VerifyAvatarPresignUrlSingleMutationModule extends ConfigurableModuleClass {}
