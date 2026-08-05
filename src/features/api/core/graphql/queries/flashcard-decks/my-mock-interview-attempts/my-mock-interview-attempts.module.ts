import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-mock-interview-attempts.module-definition"
import {
    MyMockInterviewAttemptsResolver,
} from "./my-mock-interview-attempts.resolver"
import {
    MyMockInterviewAttemptsService,
} from "./my-mock-interview-attempts.service"

@Module({
    providers: [
        MyMockInterviewAttemptsResolver,
        MyMockInterviewAttemptsService,
    ],
})
/** Feature-module boundary for the `myMockInterviewAttempts` query — wires its resolver + service. */
export class MyMockInterviewAttemptsSingleQueryModule extends ConfigurableModuleClass {}
