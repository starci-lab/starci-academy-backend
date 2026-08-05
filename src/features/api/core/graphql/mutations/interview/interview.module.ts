import {
    Module,
} from "@nestjs/common"
import {
    GradeMockInterviewSessionSingleMutationModule,
} from "./grade-mock-interview-session"
import {
    StartMockInterviewSessionSingleMutationModule,
} from "./start-mock-interview-session"
import {
    SyncMockInterviewSessionTurnsSingleMutationModule,
} from "./sync-mock-interview-session-turns"
import {
    ConfigurableModuleClass,
} from "./interview.module-definition"

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
})
/**
 * Interview mutation group -- server-side prompt draw + whole-session grading
 * for the System Design mock-interview rubric + in-flight session resume sync.
 */
export class InterviewMutationsModule extends ConfigurableModuleClass { }
