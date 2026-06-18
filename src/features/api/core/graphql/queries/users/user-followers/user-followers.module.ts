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
export class UserFollowersSingleQueryModule extends ConfigurableModuleClass {}
