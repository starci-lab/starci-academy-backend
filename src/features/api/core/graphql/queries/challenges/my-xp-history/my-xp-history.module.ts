import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-xp-history.module-definition"
import {
    MyXpHistoryResolver,
} from "./my-xp-history.resolver"

@Module({
    providers: [
        MyXpHistoryResolver,
    ],
})
export class MyXpHistorySingleQueryModule extends ConfigurableModuleClass {}
