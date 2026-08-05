import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content-ai.module-definition"
import {
    ContentAiService,
} from "./content-ai.service"

@Module({
    providers: [
        ContentAiService,
    ],
    exports: [
        ContentAiService,
    ],
})
/**
 * Content-AI business logic: grounds a learner's question in the lesson body
 * (loaded from MinIO) and enforces the premium-content gate, producing the
 * messages sent to the free model.
 *
 * All collaborators come from globally-registered modules: `S3ReadService` /
 * `S3NameResolverService` from `S3Module`, `UserService` from the bussiness
 * `UserModule`, the entity manager from the databases module, and
 * `CourseRagRetrievalService` from the app-root-global `RagModule` -- so this
 * module declares no imports.
 */
export class ContentAiModule extends ConfigurableModuleClass {
}
