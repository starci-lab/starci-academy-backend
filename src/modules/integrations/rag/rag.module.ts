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
    CourseRagRetrievalService,
} from "./course-rag-retrieval.service"
import {
    GradingRetrievalService,
} from "./grading-rag-retrieval.service"
import {
    PublicRagPlaygroundService,
} from "./public-rag-playground.service"
import {
    GithubRepoImportService,
} from "./github-repo-import.service"
import {
    PublicRagPlaygroundCleanupService,
} from "./public-rag-playground-cleanup.service"
import {
    RagPlaygroundRunRegistryService,
} from "./rag-playground-run-registry.service"
import {
    CvRagRetrievalService,
} from "./cv-rag-retrieval.service"
import {
    CvRagIndexService,
} from "./cv-rag-index.service"

@Module({
    providers: [
        ContentRagIndexService,
        CourseRagRetrievalService,
        GradingRetrievalService,
        PublicRagPlaygroundService,
        GithubRepoImportService,
        PublicRagPlaygroundCleanupService,
        RagPlaygroundRunRegistryService,
        CvRagRetrievalService,
        CvRagIndexService,
    ],
    exports: [
        ContentRagIndexService,
        CourseRagRetrievalService,
        GradingRetrievalService,
        PublicRagPlaygroundService,
        GithubRepoImportService,
        RagPlaygroundRunRegistryService,
        CvRagRetrievalService,
        CvRagIndexService,
    ],
})
/**
 * RAG module — all vector-store retrieval for the app.
 *
 * Owns {@link ContentRagIndexService} (builds the persistent `content_rag` Qdrant
 * collection at init from MinIO content + code), {@link CourseRagRetrievalService}
 * (retrieves the chunks most relevant to a content-AI question at chat time),
 * {@link GradingRetrievalService} (per-run criteria-based retrieval shared by
 * challenge git/google-docs grading + personal-project milestone grading), and
 * the PUBLIC RAG Playground stack — {@link PublicRagPlaygroundService} (index +
 * retrieve for an anonymous session), {@link GithubRepoImportService} (public
 * repo import), {@link RagPlaygroundRunRegistryService} (in-memory prepared
 * asks, consumed by the streaming gateway), and
 * {@link PublicRagPlaygroundCleanupService} (idle-session cron).
 *
 * The Qdrant client (`@modules/databases`), embedder (`@modules/langchain`),
 * S3 readers (`@modules/s3`), Winston, and the entity manager all come from
 * globally-registered modules — no explicit imports needed here.
 */
export class RagModule extends ConfigurableModuleClass {
}
