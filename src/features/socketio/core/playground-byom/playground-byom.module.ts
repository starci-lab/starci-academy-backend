import {
    Module,
} from "@nestjs/common"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    IoRedisModule,
} from "@modules/lib/native/ioredis/ioredis.module"
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
    imports: [
        IoRedisModule.register({
            instanceKeys: [
                IoRedisInstanceKey.Cache,
            ],
        }),
    ],
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
 * Imports the `Cache` ioredis instance so the gateway can rate-limit the
 * unauthenticated `agent:pair` endpoint (atomic INCR+EXPIRE) -- shared across
 * app instances, unlike an in-memory counter.
 */
export class PlaygroundByomSocketModule extends ConfigurableModuleClass {}
