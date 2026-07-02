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
export class IndexRagPlaygroundSingleMutationModule extends ConfigurableModuleClass {}
