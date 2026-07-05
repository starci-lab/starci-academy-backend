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
    ConfigurableModuleClass,
} from "./interview.module-definition"

/**
 * Interview mutation group — server-side prompt draw + whole-session grading
 * for the System Design mock-interview rubric.
 */
@Module({
    imports: [
        StartMockInterviewSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        GradeMockInterviewSessionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class InterviewMutationsModule extends ConfigurableModuleClass { }
