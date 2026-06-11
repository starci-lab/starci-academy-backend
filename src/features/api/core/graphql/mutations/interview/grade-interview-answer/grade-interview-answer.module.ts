import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    GradeInterviewAnswerResolver,
} from "./grade-interview-answer.resolver"
import {
    GradeInterviewAnswerService,
} from "./grade-interview-answer.service"
import {
    GradeInterviewAnswerHandler,
} from "./grade-interview-answer.handler"
import {
    ConfigurableModuleClass,
} from "./grade-interview-answer.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        GradeInterviewAnswerResolver,
        GradeInterviewAnswerService,
        GradeInterviewAnswerHandler,
    ],
    exports: [
        GradeInterviewAnswerService,
    ],
})
export class GradeInterviewAnswerSingleMutationModule extends ConfigurableModuleClass {}
