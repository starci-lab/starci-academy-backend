import {
    Module,
} from "@nestjs/common"
import {
    PresenceController,
} from "./presence.controller"
import {
    PresenceGateway,
} from "./presence.gateway"
import {
    PresenceStoreService,
} from "./presence-store.service"

/**
 * Lesson module for `2-presence-and-typing-indicators`.
 *
 * Shares one in-memory presence store between the gateway (mutates it on
 * join/typing/disconnect) and the REST controller (reads the roster snapshot).
 */
@Module({
    controllers: [PresenceController],
    providers: [PresenceStoreService,
        PresenceGateway],
})
export class PresenceMockModule {}
