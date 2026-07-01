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
import {
    GradingRetrievalService,
} from "./grading-rag-retrieval.service"

/**
 * RAG module — all vector-store retrieval for the app.
 *
 * Owns {@link LessonRagIndexService} (builds the persistent `lesson_rag` Qdrant
 * collection at init from MinIO content + code), {@link LessonRagRetrievalService}
 * (retrieves the chunks most relevant to a content-AI question at chat time), and
 * {@link GradingRetrievalService} (per-run criteria-based retrieval shared by
 * challenge git/google-docs grading + personal-project milestone grading).
 *
 * The Qdrant client (`@modules/databases`), embedder (`@modules/langchain`),
 * S3 readers (`@modules/s3`), Winston, and the entity manager all come from
 * globally-registered modules — no explicit imports needed here.
 */
@Module({
    providers: [
        LessonRagIndexService,
        LessonRagRetrievalService,
        GradingRetrievalService,
    ],
    exports: [
        LessonRagIndexService,
        LessonRagRetrievalService,
        GradingRetrievalService,
    ],
})
export class RagModule extends ConfigurableModuleClass {
}
