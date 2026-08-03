import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-feed.module-definition"
import {
    UserFeedResolver,
} from "./user-feed.resolver"

/**
 * Registers {@link UserFeedResolver} as a leaf query module — the schema
 * discovers the `userFeed` operation through this registration, per
 * [[naming-and-structure]] §5.
 */
@Module({
    providers: [
        UserFeedResolver,
    ],
})
export class UserFeedSingleQueryModule extends ConfigurableModuleClass {}
