import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
} from "@nestjs/websockets"
import {
    AutocompleteWebSocketGateway,
    WsResponseService,
} from "@modules/socketio"
import type {
    TypedSocket, 
} from "@modules/socketio"
import {
    PublicationEvent,
    SubscriptionEvent,
} from "../../enums"
import type {
    GlobalSearchSocketIoPayload,
} from "./handle-global-search"
import {
    GlobalSearchService,
} from "./handle-global-search"
/**
 * WebSocket gateway that streams autocomplete suggestions in real-time.
 */
@AutocompleteWebSocketGateway()
export class GlobalSearchGateway {
    constructor(
        private readonly globalSearchService: GlobalSearchService,
        private readonly wsResponseService: WsResponseService,
    ) {}

    /**
     * Handle autocomplete requests.
     */
    @SubscribeMessage(PublicationEvent.GlobalSearch)
    async handleGlobalSearch(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: GlobalSearchSocketIoPayload,
    ) {
        const result = await this.globalSearchService.execute({
            payload,
            client,
        })
        this.wsResponseService.success({
            message: "Global search results published successfully",
            data: result,
            client,
            eventName: SubscriptionEvent.GlobalSearch,
        })
    }
}
