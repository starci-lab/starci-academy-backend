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
/** Feature-module boundary for the `myFlashcardStats` query -- wires its resolver (business logic lives in the shared projection service). */
export class MyFlashcardStatsSingleQueryModule extends ConfigurableModuleClass {}
