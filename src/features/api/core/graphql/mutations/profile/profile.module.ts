import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./profile.module-definition"
import {
    UpdateProfileSingleMutationModule,
} from "./update-profile"

/**
 * Profile mutation group (edit display name, bio, avatar).
 */
@Module({
    imports: [
        UpdateProfileSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class ProfileMutationsModule extends ConfigurableModuleClass {}
