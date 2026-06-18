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
export class MyDailyQuestSingleQueryModule extends ConfigurableModuleClass {}
