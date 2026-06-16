import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-upcoming-livestreams.module-definition"
import {
    MyUpcomingLivestreamsResolver,
} from "./my-upcoming-livestreams.resolver"

@Module({
    providers: [
        MyUpcomingLivestreamsResolver,
    ],
})
export class MyUpcomingLivestreamsSingleQueryModule extends ConfigurableModuleClass {}
