import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./rag.module-definition"
import {
    LessonRagIndexService,
} from "./lesson-rag-index.service"
import {
    LessonRagRetrievalService,
} from "./lesson-rag-retrieval.service"

/**
 * RAG module — per-lesson vector index + retrieval.
 *
 * Owns {@link LessonRagIndexService} (builds the persistent `lesson_rag` Qdrant
 * collection at init from MinIO content + code) and
 * {@link LessonRagRetrievalService} (retrieves the chunks most relevant to a
 * content-AI question at chat time).
 *
 * The Qdrant client (`@modules/databases`), embedder (`@modules/langchain`),
 * S3 readers (`@modules/s3`), Winston, and the entity manager all come from
 * globally-registered modules — no explicit imports needed here.
 */
@Module({
    providers: [
        LessonRagIndexService,
        LessonRagRetrievalService,
    ],
    exports: [
        LessonRagIndexService,
        LessonRagRetrievalService,
    ],
})
export class RagModule extends ConfigurableModuleClass {
}
