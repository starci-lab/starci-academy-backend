import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-mock-interview-stats.module-definition"
import {
    MyMockInterviewStatsResolver,
} from "./my-mock-interview-stats.resolver"
import {
    MyMockInterviewStatsService,
} from "./my-mock-interview-stats.service"

@Module({
    providers: [
        MyMockInterviewStatsResolver,
        MyMockInterviewStatsService,
    ],
})
export class MyMockInterviewStatsSingleQueryModule extends ConfigurableModuleClass {}
