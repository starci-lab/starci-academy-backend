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
/**
 * Wires the public (no-login) `ragPlaygroundSamples` catalog. Resolver-
 * only -- lists id + label; code is revealed only when a session indexes
 * the chosen sample.
 */
export class RagPlaygroundSamplesSingleQueryModule extends ConfigurableModuleClass {}
