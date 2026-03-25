import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./langchain.module-definition"
import {
    LangchainService,
} from "./langchain.service"

@Module({
    providers: [
        LangchainService,
    ],
    exports: [
        LangchainService,
    ],
})
export class LangchainModule extends ConfigurableModuleClass {}
