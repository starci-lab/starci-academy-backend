import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-flashcard-quiz-stats.module-definition"
import {
    MyFlashcardQuizStatsResolver,
} from "./my-flashcard-quiz-stats.resolver"
import {
    MyFlashcardQuizStatsService,
} from "./my-flashcard-quiz-stats.service"

@Module({
    providers: [
        MyFlashcardQuizStatsResolver,
        MyFlashcardQuizStatsService,
    ],
})
/** Feature-module boundary for the `myFlashcardQuizStats` query — wires its resolver + service. */
export class MyFlashcardQuizStatsSingleQueryModule extends ConfigurableModuleClass {}
