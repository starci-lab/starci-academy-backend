import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-in-progress-mock-interview-session.module-definition"
import {
    MyInProgressMockInterviewSessionResolver,
} from "./my-in-progress-mock-interview-session.resolver"
import {
    MyInProgressMockInterviewSessionService,
} from "./my-in-progress-mock-interview-session.service"

/** Feature-module boundary for the `myInProgressMockInterviewSession` query — wires its resolver + service. */
@Module({
    providers: [
        MyInProgressMockInterviewSessionResolver,
        MyInProgressMockInterviewSessionService,
    ],
})
export class MyInProgressMockInterviewSessionSingleQueryModule extends ConfigurableModuleClass {}
