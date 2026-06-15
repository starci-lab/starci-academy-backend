import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-feed.module-definition"
import {
    UserFeedResolver,
} from "./user-feed.resolver"

@Module({
    providers: [
        UserFeedResolver,
    ],
})
export class UserFeedSingleQueryModule extends ConfigurableModuleClass {}
