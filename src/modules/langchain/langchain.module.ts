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
import {
    ModelService 
} from "./model.service"

@Module({
    providers: [
        LangchainService,
        EmbeddingModelService,
        ModelService,
    ],
    exports: [
        LangchainService,
        EmbeddingModelService,
        ModelService,
    ],
})
export class LangchainModule extends ConfigurableModuleClass {}
