import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-followers.module-definition"
import {
    UserFollowersResolver,
} from "./user-followers.resolver"

@Module({
    providers: [
        UserFollowersResolver,
    ],
})
/** Feature-module boundary for the `userFollowers` query -- wires its resolver so the users group can mount this profile tab independently. */
export class UserFollowersSingleQueryModule extends ConfigurableModuleClass {}
