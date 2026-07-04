import {
    Module,
} from "@nestjs/common"
import {
    GradeMockInterviewSessionSingleMutationModule,
} from "./grade-mock-interview-session"
import {
    ConfigurableModuleClass,
} from "./interview.module-definition"

/**
 * Interview mutation group — whole-session grading for the System Design
 * mock-interview rubric.
 */
@Module({
    imports: [
        GradeMockInterviewSessionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class InterviewMutationsModule extends ConfigurableModuleClass { }
