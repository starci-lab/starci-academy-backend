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
/** Feature-module boundary for the `myUpcomingLivestreams` query — wires its resolver so the dashboard group can mount this widget independently. */
export class MyUpcomingLivestreamsSingleQueryModule extends ConfigurableModuleClass {}
