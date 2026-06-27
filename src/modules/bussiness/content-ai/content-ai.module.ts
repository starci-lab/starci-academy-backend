import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content-ai.module-definition"
import {
    ContentAiService,
} from "./content-ai.service"

/**
 * Content-AI business logic: grounds a learner's question in the lesson body
 * (loaded from MinIO) and enforces the premium-content gate, producing the
 * messages sent to the free model.
 *
 * `S3ReadService` / `S3NameResolverService` come from the global `S3Module`,
 * `UserService` from the bussiness `UserModule`, and the entity manager from
 * the global databases module — all global, so no explicit imports here.
 */
@Module({
    providers: [
        ContentAiService,
    ],
    exports: [
        ContentAiService,
    ],
})
export class ContentAiModule extends ConfigurableModuleClass {
}
