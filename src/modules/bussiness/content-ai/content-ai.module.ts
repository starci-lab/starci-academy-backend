import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content-ai.module-definition"
import {
    ContentAiService,
} from "./content-ai.service"
import {
    RagModule,
} from "@modules/rag"

/**
 * Content-AI business logic: grounds a learner's question in the lesson body
 * (loaded from MinIO) and enforces the premium-content gate, producing the
 * messages sent to the free model.
 *
 * `S3ReadService` / `S3NameResolverService` come from the global `S3Module`,
 * `UserService` from the bussiness `UserModule`, and the entity manager from
 * the global databases module — all global, so no explicit imports for those.
 * `RagModule` (hybrid-grounding retrieval) is imported explicitly below.
 */
@Module({
    imports: [
        // RAG retrieval for the hybrid grounding path. Imported explicitly (not
        // relying solely on the global registration in `InitModule`) so content-AI
        // chat resolves `LessonRagRetrievalService` even in an app/worker that does
        // not load `InitModule`. The retrieval service is stateless, so the extra
        // module instance is harmless.
        RagModule.register({
        }),
    ],
    providers: [
        ContentAiService,
    ],
    exports: [
        ContentAiService,
    ],
})
export class ContentAiModule extends ConfigurableModuleClass {
}
