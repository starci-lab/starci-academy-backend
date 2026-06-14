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
export class UpdateProfileSingleMutationModule extends ConfigurableModuleClass {}
