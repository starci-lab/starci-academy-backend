import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-feed.module-definition"
import {
    MyFeedResolver,
} from "./my-feed.resolver"

@Module({
    providers: [
        MyFeedResolver,
    ],
})
export class MyFeedSingleQueryModule extends ConfigurableModuleClass {}
