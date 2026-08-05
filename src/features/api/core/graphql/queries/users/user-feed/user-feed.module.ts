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
/**
 * Registers {@link UserFeedResolver} as a leaf query module -- the schema
 * discovers the `userFeed` operation through this registration, per
 * [[naming-and-structure]] §5.
 */
export class UserFeedSingleQueryModule extends ConfigurableModuleClass {}
