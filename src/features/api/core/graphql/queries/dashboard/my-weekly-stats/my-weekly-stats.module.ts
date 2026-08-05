import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-weekly-stats.module-definition"
import {
    MyWeeklyStatsResolver,
} from "./my-weekly-stats.resolver"

@Module({
    providers: [
        MyWeeklyStatsResolver,
    ],
})
/** Feature-module boundary for the `myWeeklyStats` query — wires its resolver so the dashboard group can mount this widget independently. */
export class MyWeeklyStatsSingleQueryModule extends ConfigurableModuleClass {}
