import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    StartMockInterviewSessionResolver,
} from "./start-mock-interview-session.resolver"
import {
    StartMockInterviewSessionService,
} from "./start-mock-interview-session.service"
import {
    StartMockInterviewSessionHandler,
} from "./start-mock-interview-session.handler"
import {
    MockInterviewSessionDrawService,
} from "./start-mock-interview-session-draw.service"
import {
    ConfigurableModuleClass,
} from "./start-mock-interview-session.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        StartMockInterviewSessionResolver,
        StartMockInterviewSessionService,
        StartMockInterviewSessionHandler,
        MockInterviewSessionDrawService,
    ],
    exports: [
        StartMockInterviewSessionService,
    ],
})
export class StartMockInterviewSessionSingleMutationModule extends ConfigurableModuleClass {}
