import {
    Module,
} from "@nestjs/common"
import {
    GradeMockInterviewSessionSingleMutationModule,
} from "./grade-mock-interview-session/grade-mock-interview-session.module"
import {
    StartMockInterviewSessionSingleMutationModule,
} from "./start-mock-interview-session/start-mock-interview-session.module"
import {
    SyncMockInterviewSessionTurnsSingleMutationModule,
} from "./sync-mock-interview-session-turns/sync-mock-interview-session-turns.module"
import {
    ConfigurableModuleClass,
} from "./interview.module-definition"
import {
    AbandonMockInterviewSessionResolver,
    AbandonMockInterviewSessionService,
} from "./abandon-mock-interview-session"
import {
    CompleteMockInterviewSessionResolver,
    CompleteMockInterviewSessionService,
} from "./complete-mock-interview-session"
import {
    RetryMockInterviewSessionGradingResolver,
    RetryMockInterviewSessionGradingService,
} from "./retry-mock-interview-session-grading"

@Module({
    imports: [
        StartMockInterviewSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        GradeMockInterviewSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        SyncMockInterviewSessionTurnsSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        AbandonMockInterviewSessionResolver,
        AbandonMockInterviewSessionService,
        CompleteMockInterviewSessionResolver,
        CompleteMockInterviewSessionService,
        RetryMockInterviewSessionGradingResolver,
        RetryMockInterviewSessionGradingService,
    ],
})
/**
 * Interview mutation group -- server-side prompt draw + whole-session grading
 * for the System Design mock-interview rubric + in-flight session resume sync.
 */
export class InterviewMutationsModule extends ConfigurableModuleClass { }
