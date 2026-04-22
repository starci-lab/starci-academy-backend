import {
    Injectable,
    UseInterceptors,
} from "@nestjs/common"
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import {
    Namespace,
} from "socket.io"
import {
    SearchWebSocketGateway,
    SocketIoEvent,
    TypedSocket,
    WsSuccessMessage,
    WsTransformInterceptor,
} from "@modules/socketio"
import {
    AutocompleteRequest,
    AutocompleteResponse,
} from "../dtos"
import {
    AutocompleteService,
} from "../services"

/**
 * WebSocket gateway that streams autocomplete suggestions in real-time.
 *
 * Client usage:
 *   socket = io("<host>/search")
 *   socket.emit("search.autocomplete", { query: "re" })
 *   socket.on("search.autocomplete.result", (res) => ...)
 *
 * Suggestions are backed by an Elasticsearch `search_as_you_type`
 * field on the document title with a fuzzy fallback for typos.
 */
@Injectable()
@SearchWebSocketGateway()
export class SearchGateway {
    @WebSocketServer()
        server: Namespace

    constructor(
        private readonly autocompleteService: AutocompleteService,
    ) {}

    @WsSuccessMessage("Autocomplete suggestions fetched successfully")
    @UseInterceptors(WsTransformInterceptor)
    @SubscribeMessage(SocketIoEvent.Autocomplete)
    async handleAutocomplete(
        @ConnectedSocket() _client: TypedSocket,
        @MessageBody() data: AutocompleteRequest,
    ): Promise<AutocompleteResponse> {
        return this.autocompleteService.autocomplete(data)
    }
}
