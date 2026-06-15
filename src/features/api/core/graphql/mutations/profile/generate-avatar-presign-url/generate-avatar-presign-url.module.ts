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
export class GenerateAvatarPresignUrlSingleMutationModule extends ConfigurableModuleClass {}
