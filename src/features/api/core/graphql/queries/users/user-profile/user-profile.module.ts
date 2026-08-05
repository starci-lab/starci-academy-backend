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
/** Feature-module boundary for the `userProfile` query — wires its resolver so the users group can mount this profile tab independently. */
export class UserProfileSingleQueryModule extends ConfigurableModuleClass {}
