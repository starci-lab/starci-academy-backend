import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./playground-byom.module-definition"
import {
    PlaygroundByomGateway,
} from "./playground-byom.gateway"
import {
    PlaygroundByomRoomService,
} from "./playground-byom-room.service"

/**
 * Module providing the Socket.IO Playground BYOM gateway (relays shell
 * commands + resource reports between a browser and a learner's local CLI
 * agent, in the `/playground_byom` namespace).
 */
@Module({
    providers: [
        PlaygroundByomGateway,
        PlaygroundByomRoomService,
    ],
    exports: [
        PlaygroundByomGateway,
    ],
})
export class PlaygroundByomSocketModule extends ConfigurableModuleClass {}
