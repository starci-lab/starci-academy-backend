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
export class MyWeeklyStatsSingleQueryModule extends ConfigurableModuleClass {}
