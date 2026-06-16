import {
    Controller, Get, Param, UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation, ApiTags,
} from "@nestjs/swagger"
import {
    MockDelayInterceptor,
} from "../../interceptors"
import {
    PresenceStoreService,
} from "./presence-store.service"

/**
 * REST presence controller for lesson `2-presence-and-typing-indicators`.
 *
 * Exposes an HTTP snapshot of who is online in a room — the same data the WS
 * `join` ack returns — so the demo can show that presence is queryable out of
 * band. Mounted under the session path used by the sandbox `VITE_API_BASE`.
 */
@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/8-websocket-realtime-communication/2-presence-and-typing-indicators/sessions/:sessionId")
export class PresenceController {
    constructor(private readonly store: PresenceStoreService) {}

    /**
     * Snapshot the online members of a room.
     */
    @ApiOperation({
        summary: "List online members of a room",
    })
    @Get("presence/:room")
    getPresence(
        @Param("room") room: string,
    ): { members: Array<string> } {
        // read the live roster straight from the in-memory presence store
        return {
            members: this.store.members(room) 
        }
    }
}
