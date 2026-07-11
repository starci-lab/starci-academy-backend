import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./rag-playground.module-definition"
import {
    RagPlaygroundSamplesSingleQueryModule,
} from "./rag-playground-samples"

/**
 * RAG Playground query group — currently just the curated sample catalog
 * listing (`ragPlaygroundSamples`), a PUBLIC (no login) read matching the
 * `@modules/rag` `PublicRagPlaygroundService` mutation group.
 */
@Module({
    imports: [
        RagPlaygroundSamplesSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class RagPlaygroundQueriesModule extends ConfigurableModuleClass {}
