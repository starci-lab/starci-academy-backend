import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./langchain.module-definition"
import {
    LangchainService,
} from "./langchain.service"
import {
    EmbeddingModelService
} from "./embedding-model.service"

@Module({
    providers: [
        LangchainService,
        EmbeddingModelService,
    ],
    exports: [
        LangchainService,
        EmbeddingModelService,
    ],
})
/**
 * Exposes {@link LangchainService} + {@link EmbeddingModelService} so RAG/grading
 * share one embedder + prompt helper instead of each feature constructing its
 * own LangChain stack (and drifting model/prompt defaults).
 */
export class LangchainModule extends ConfigurableModuleClass {}
