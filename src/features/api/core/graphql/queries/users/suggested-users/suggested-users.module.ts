import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./suggested-users.module-definition"
import {
    SuggestedUsersResolver,
} from "./suggested-users.resolver"

@Module({
    providers: [
        SuggestedUsersResolver,
    ],
})
/** Feature-module boundary for the `suggestedUsers` query -- wires its resolver so the users group can mount this profile tab independently. */
export class SuggestedUsersSingleQueryModule extends ConfigurableModuleClass {}
