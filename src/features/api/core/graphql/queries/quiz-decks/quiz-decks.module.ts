import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./quiz-decks.module-definition"
import {
    QuizDecksByCourseSingleQueryModule,
} from "./quiz-decks-by-course"
import {
    QuizDeckSingleQueryModule,
} from "./quiz-deck"

/**
 * Quiz-deck query group (deck listing by course + single-deck detail).
 */
@Module({
    imports: [
        QuizDecksByCourseSingleQueryModule.register({
            isGlobal: true,
        }),
        QuizDeckSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class QuizDecksQueriesModule extends ConfigurableModuleClass {}
