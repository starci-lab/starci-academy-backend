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

@Module({
    providers: [
        PlaygroundByomGateway,
        PlaygroundByomRoomService,
    ],
    exports: [
        PlaygroundByomGateway,
    ],
})
/**
 * Module providing the Socket.IO Playground BYOM gateway (relays shell
 * commands + resource reports between a browser and a learner's local CLI
 * agent, in the `/playground_byom` namespace).
 *
 * The gateway rate-limits the unauthenticated `agent:pair` endpoint with an
 * atomic INCR+EXPIRE against the `Cache` ioredis instance -- shared across app
 * instances, unlike an in-memory counter. That instance arrives through the
 * global `IoRedisModule.register({ instanceKeys: [Cache], isGlobal: true })` at
 * the app root, so this module imports nothing (naming-and-structure §8).
 */
export class PlaygroundByomSocketModule extends ConfigurableModuleClass {}
