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
export class LangchainModule extends ConfigurableModuleClass {}
