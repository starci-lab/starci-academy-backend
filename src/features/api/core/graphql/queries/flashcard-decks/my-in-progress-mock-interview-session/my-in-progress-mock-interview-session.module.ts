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

@Module({
    providers: [
        MyInProgressMockInterviewSessionResolver,
        MyInProgressMockInterviewSessionService,
    ],
})
export class MyInProgressMockInterviewSessionSingleQueryModule extends ConfigurableModuleClass {}
