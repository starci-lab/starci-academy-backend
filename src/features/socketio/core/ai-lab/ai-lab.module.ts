import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-lab.module-definition"
import {
    AiLabGateway,
} from "./ai-lab.gateway"
import {
    AiLabRunRoomService,
} from "./ai-lab-run-room.service"

/**
 * Module providing the Socket.IO AI Lab gateway (playground prompt token
 * streaming in the `/ai_lab` namespace).
 *
 * `AiLabRunService` (run orchestration) comes from the globally-registered
 * `AiLabModule` and `AiInvokeService` from the global `AiModule`, so neither is
 * imported explicitly here.
 */
@Module({
    providers: [
        AiLabGateway,
        AiLabRunRoomService,
    ],
    exports: [
        AiLabGateway,
        AiLabRunRoomService,
    ],
})
export class AiLabModule extends ConfigurableModuleClass {}
