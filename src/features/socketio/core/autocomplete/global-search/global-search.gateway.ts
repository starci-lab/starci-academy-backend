import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
} from "@nestjs/websockets"
import {
    AutocompleteWebSocketGateway,
} from "@modules/platform/socketio/decorators/gateway"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import type {
    TypedSocket,
} from "@modules/platform/socketio/types/socket"
import {
    PublicationEvent,
} from "../../enums/publication-event"
import {
    SubscriptionEvent,
} from "../../enums/subscription-event"
import type {
    GlobalSearchSocketIoPayload,
} from "./handle-global-search/types/payload"
import {
    GlobalSearchService,
} from "./handle-global-search/global-search.service"
@AutocompleteWebSocketGateway()
/**
 * WebSocket gateway that streams autocomplete suggestions in real-time.
 */
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
