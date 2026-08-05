import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content-ai.module-definition"
import {
    ContentAiGateway,
} from "./content-ai.gateway"

@Module({
    providers: [
        ContentAiGateway,
    ],
    exports: [
        ContentAiGateway,
    ],
})
/**
 * Module providing the Socket.IO content-AI gateway (grounded lesson Q&A answer
 * token streaming in the `/content_ai` namespace).
 *
 * `ContentAiService` comes from the globally-registered bussiness `ContentAiModule`
 * and `AiInvokeService` from the global `AiModule`, so neither is imported here.
 */
export class ContentAiModule extends ConfigurableModuleClass {}
