import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-profile.module-definition"
import {
    UserProfileResolver,
} from "./user-profile.resolver"

@Module({
    providers: [
        UserProfileResolver,
    ],
})
export class UserProfileSingleQueryModule extends ConfigurableModuleClass {}
