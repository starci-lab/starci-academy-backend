import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ask-rag-playground.module-definition"
import {
    AskRagPlaygroundResolver,
} from "./ask-rag-playground.resolver"

@Module({
    providers: [
        AskRagPlaygroundResolver,
    ],
})
/**
 * Registers the RAG ask leaf separately from index -- a query must not be
 * able to trigger re-indexing via the same mutation.
 */
export class AskRagPlaygroundSingleMutationModule extends ConfigurableModuleClass {}
