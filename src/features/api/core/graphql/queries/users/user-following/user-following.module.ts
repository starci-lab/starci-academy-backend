import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-following.module-definition"
import {
    UserFollowingResolver,
} from "./user-following.resolver"

@Module({
    providers: [
        UserFollowingResolver,
    ],
})
/** Feature-module boundary for the `userFollowing` query — wires its resolver so the users group can mount this profile tab independently. */
export class UserFollowingSingleQueryModule extends ConfigurableModuleClass {}
