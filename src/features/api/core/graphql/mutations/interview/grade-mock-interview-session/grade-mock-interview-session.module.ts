import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    GradeMockInterviewSessionResolver,
} from "./grade-mock-interview-session.resolver"
import {
    GradeMockInterviewSessionService,
} from "./grade-mock-interview-session.service"
import {
    GradeMockInterviewSessionHandler,
} from "./grade-mock-interview-session.handler"
import {
    MockInterviewGradingService,
} from "./grade-mock-interview-session-grading.service"
import {
    MockInterviewGradePromptService,
} from "./grade-mock-interview-session-prompt.service"
import {
    ConfigurableModuleClass,
} from "./grade-mock-interview-session.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        GradeMockInterviewSessionResolver,
        GradeMockInterviewSessionService,
        GradeMockInterviewSessionHandler,
        MockInterviewGradingService,
        MockInterviewGradePromptService,
    ],
    exports: [
        GradeMockInterviewSessionService,
    ],
})
export class GradeMockInterviewSessionSingleMutationModule extends ConfigurableModuleClass {}
