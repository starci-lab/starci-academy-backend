import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./generate-avatar-presign-url.module-definition"
import {
    GenerateAvatarPresignUrlResolver,
} from "./generate-avatar-presign-url.resolver"
import {
    GenerateAvatarPresignUrlService,
} from "./generate-avatar-presign-url.service"
import {
    GenerateAvatarPresignUrlHandler,
} from "./generate-avatar-presign-url.handler"

@Module({
    providers: [
        GenerateAvatarPresignUrlResolver,
        GenerateAvatarPresignUrlService,
        GenerateAvatarPresignUrlHandler,
    ],
})
/**
 * Registers avatar presign mint (resolver + service + handler) separately
 * from verify — a client must not be able to confirm an upload it never
 * received a URL for via one combined leaf.
 */
export class GenerateAvatarPresignUrlSingleMutationModule extends ConfigurableModuleClass {}
