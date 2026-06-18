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
export class UserFollowingSingleQueryModule extends ConfigurableModuleClass {}
