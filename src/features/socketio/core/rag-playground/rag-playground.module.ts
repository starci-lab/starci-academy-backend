import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./rag-playground.module-definition"
import {
    RagPlaygroundGateway,
} from "./rag-playground.gateway"

@Module({
    providers: [
        RagPlaygroundGateway,
    ],
    exports: [
        RagPlaygroundGateway,
    ],
})
/**
 * Module providing the Socket.IO RAG Playground gateway (public answer
 * streaming in the `/rag_playground` namespace).
 *
 * `RagPlaygroundRunRegistryService` comes from the globally-registered
 * `RagModule` and `AiInvokeService` from the global `AiModule`, so neither is
 * imported explicitly here.
 */
export class RagPlaygroundSocketModule extends ConfigurableModuleClass {}
