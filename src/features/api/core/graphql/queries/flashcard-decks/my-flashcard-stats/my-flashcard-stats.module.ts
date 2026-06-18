import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-flashcard-stats.module-definition"
import {
    MyFlashcardStatsResolver,
} from "./my-flashcard-stats.resolver"

@Module({
    providers: [
        MyFlashcardStatsResolver,
    ],
})
export class MyFlashcardStatsSingleQueryModule extends ConfigurableModuleClass {}
