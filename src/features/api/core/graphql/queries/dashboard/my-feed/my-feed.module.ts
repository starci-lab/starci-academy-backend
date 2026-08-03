import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-feed.module-definition"
import {
    MyFeedResolver,
} from "./my-feed.resolver"

/**
 * Registers {@link MyFeedResolver} as a leaf query module — the schema
 * discovers the `myFeed` operation through this registration, per
 * [[naming-and-structure]] §5.
 */
@Module({
    providers: [
        MyFeedResolver,
    ],
})
export class MyFeedSingleQueryModule extends ConfigurableModuleClass {}
