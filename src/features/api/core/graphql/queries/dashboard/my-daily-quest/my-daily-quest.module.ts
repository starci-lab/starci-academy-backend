import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-daily-quest.module-definition"
import {
    MyDailyQuestResolver,
} from "./my-daily-quest.resolver"

@Module({
    providers: [
        MyDailyQuestResolver,
    ],
})
/** Feature-module boundary for the `myDailyQuest` query — wires its resolver so the dashboard group can mount this widget independently. */
export class MyDailyQuestSingleQueryModule extends ConfigurableModuleClass {}
