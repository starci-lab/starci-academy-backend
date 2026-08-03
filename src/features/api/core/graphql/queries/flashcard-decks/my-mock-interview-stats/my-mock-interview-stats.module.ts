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

/** Feature-module boundary for the `myMockInterviewStats` query — wires its resolver + service. */
@Module({
    providers: [
        MyMockInterviewStatsResolver,
        MyMockInterviewStatsService,
    ],
})
export class MyMockInterviewStatsSingleQueryModule extends ConfigurableModuleClass {}
