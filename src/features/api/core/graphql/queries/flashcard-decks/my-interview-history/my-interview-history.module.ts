import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-interview-history.module-definition"
import {
    MyInterviewHistoryResolver,
} from "./my-interview-history.resolver"

@Module({
    providers: [
        MyInterviewHistoryResolver,
    ],
})
export class MyInterviewHistorySingleQueryModule extends ConfigurableModuleClass {}
