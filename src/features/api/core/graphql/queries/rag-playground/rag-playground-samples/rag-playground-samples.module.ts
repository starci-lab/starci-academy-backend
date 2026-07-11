import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./rag-playground-samples.module-definition"
import {
    RagPlaygroundSamplesResolver,
} from "./rag-playground-samples.resolver"

@Module({
    providers: [
        RagPlaygroundSamplesResolver,
    ],
})
export class RagPlaygroundSamplesSingleQueryModule extends ConfigurableModuleClass {}
