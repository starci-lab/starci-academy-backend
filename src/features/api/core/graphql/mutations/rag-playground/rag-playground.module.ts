import {
    Module,
} from "@nestjs/common"
import {
    IndexRagPlaygroundSingleMutationModule,
} from "./index-rag-playground/index-rag-playground.module"
import {
    AskRagPlaygroundSingleMutationModule,
} from "./ask-rag-playground/ask-rag-playground.module"
import {
    ConfigurableModuleClass,
} from "./rag-playground.module-definition"

@Module({
    imports: [
        IndexRagPlaygroundSingleMutationModule.register({
            isGlobal: true,
        }),
        AskRagPlaygroundSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * RAG Playground mutation group -- PUBLIC (no login) code-import + grounded-ask
 * flow for the anonymous marketing demo (see `@modules/rag`
 * `PublicRagPlaygroundService`). Answer streaming itself happens over the
 * public `/rag_playground` Socket.IO namespace, not GraphQL.
 */
export class RagPlaygroundMutationsModule extends ConfigurableModuleClass { }
