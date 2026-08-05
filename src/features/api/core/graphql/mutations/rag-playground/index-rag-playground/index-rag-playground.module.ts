import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./index-rag-playground.module-definition"
import {
    IndexRagPlaygroundResolver,
} from "./index-rag-playground.resolver"

@Module({
    providers: [
        IndexRagPlaygroundResolver,
    ],
})
/**
 * Registers RAG (re)index as its own Nest unit so corpus rebuild stays off
 * the ask path.
 */
export class IndexRagPlaygroundSingleMutationModule extends ConfigurableModuleClass {}
