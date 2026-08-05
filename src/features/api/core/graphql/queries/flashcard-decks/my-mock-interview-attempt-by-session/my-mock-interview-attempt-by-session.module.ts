import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-mock-interview-attempt-by-session.module-definition"
import {
    MyMockInterviewAttemptBySessionResolver,
} from "./my-mock-interview-attempt-by-session.resolver"
import {
    MyMockInterviewAttemptBySessionService,
} from "./my-mock-interview-attempt-by-session.service"

@Module({
    providers: [
        MyMockInterviewAttemptBySessionResolver,
        MyMockInterviewAttemptBySessionService,
    ],
})
/** Feature-module boundary for the `myMockInterviewAttemptBySessionId` query -- wires its resolver + service. */
export class MyMockInterviewAttemptBySessionSingleQueryModule extends ConfigurableModuleClass {}
