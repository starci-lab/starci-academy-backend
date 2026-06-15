import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./profile.module-definition"
import {
    UpdateProfileSingleMutationModule,
} from "./update-profile"
import {
    GenerateAvatarPresignUrlSingleMutationModule,
} from "./generate-avatar-presign-url"
import {
    VerifyAvatarPresignUrlSingleMutationModule,
} from "./verify-avatar-presign-url"

/**
 * Profile mutation group (edit display name, bio, avatar). Avatar upload is a
 * presigned-URL flow: generateAvatarPresignUrl → client PUTs to MinIO →
 * verifyAvatarPresignUrl persists it (mirrors the CV submission flow).
 */
@Module({
    imports: [
        UpdateProfileSingleMutationModule.register({
            isGlobal: true,
        }),
        GenerateAvatarPresignUrlSingleMutationModule.register({
            isGlobal: true,
        }),
        VerifyAvatarPresignUrlSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class ProfileMutationsModule extends ConfigurableModuleClass {}
