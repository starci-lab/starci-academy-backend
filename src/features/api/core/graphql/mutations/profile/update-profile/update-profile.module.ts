import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./update-profile.module-definition"
import {
    UpdateProfileResolver,
} from "./update-profile.resolver"

@Module({
    providers: [
        UpdateProfileResolver,
    ],
})
/**
 * Registers the profile-fields write (display name, bio, …) so avatar
 * presign / verify stay on their own leaves.
 */
export class UpdateProfileSingleMutationModule extends ConfigurableModuleClass {}
