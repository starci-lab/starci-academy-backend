import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./rag.module-definition"
import {
    ContentRagIndexService,
} from "./content-rag-index.service"
import {
    ContentRagRetrievalService,
} from "./content-rag-retrieval.service"
import {
    GradingRetrievalService,
} from "./grading-rag-retrieval.service"

/**
 * RAG module — all vector-store retrieval for the app.
 *
 * Owns {@link ContentRagIndexService} (builds the persistent `content_rag` Qdrant
 * collection at init from MinIO content + code), {@link ContentRagRetrievalService}
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
        ContentRagIndexService,
        ContentRagRetrievalService,
        GradingRetrievalService,
    ],
    exports: [
        ContentRagIndexService,
        ContentRagRetrievalService,
        GradingRetrievalService,
    ],
})
export class RagModule extends ConfigurableModuleClass {
}
