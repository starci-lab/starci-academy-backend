import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-flashcard-stats.module-definition"
import {
    MyFlashcardStatsResolver,
} from "./my-flashcard-stats.resolver"

/** Feature-module boundary for the `myFlashcardStats` query — wires its resolver (business logic lives in the shared projection service). */
@Module({
    providers: [
        MyFlashcardStatsResolver,
    ],
})
export class MyFlashcardStatsSingleQueryModule extends ConfigurableModuleClass {}
