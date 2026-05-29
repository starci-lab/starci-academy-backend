import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./quiz-deck.module-definition"
import {
    QuizDeckResolver,
} from "./quiz-deck.resolver"

@Module({
    providers: [
        QuizDeckResolver,
    ],
})
export class QuizDeckSingleQueryModule extends ConfigurableModuleClass {}
