import {
    Module,
} from "@nestjs/common"
import {
    GradeInterviewAnswerSingleMutationModule,
} from "./grade-interview-answer"
import {
    ConfigurableModuleClass,
} from "./interview.module-definition"

/**
 * Interview mutation group — stateless AI grading of transcribed flashcard
 * answers (mock-interview flow).
 */
@Module({
    imports: [
        GradeInterviewAnswerSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class InterviewMutationsModule extends ConfigurableModuleClass { }
