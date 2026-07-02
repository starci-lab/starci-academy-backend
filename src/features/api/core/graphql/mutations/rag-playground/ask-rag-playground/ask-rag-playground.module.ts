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
export class AskRagPlaygroundSingleMutationModule extends ConfigurableModuleClass {}
