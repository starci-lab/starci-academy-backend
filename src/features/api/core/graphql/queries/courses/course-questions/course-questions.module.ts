import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course-questions.module-definition"
import {
    CourseQuestionsResolver,
} from "./course-questions.resolver"
import {
    CourseQuestionsService,
} from "./course-questions.service"

@Module({
    providers: [
        CourseQuestionsService,
        CourseQuestionsResolver,
    ],
})
export class CourseQuestionsSingleQueryModule extends ConfigurableModuleClass {}
