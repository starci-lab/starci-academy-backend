import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./quiz-decks-by-course.module-definition"
import {
    QuizDecksByCourseResolver,
} from "./quiz-decks-by-course.resolver"

@Module({
    providers: [
        QuizDecksByCourseResolver,
    ],
})
export class QuizDecksByCourseSingleQueryModule extends ConfigurableModuleClass {}
