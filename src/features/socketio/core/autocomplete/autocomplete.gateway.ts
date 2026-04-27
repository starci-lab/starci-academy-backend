import {
    Namespace,
} from "socket.io"
import {
    WebSocketServer,
} from "@nestjs/websockets"
import {
    AutocompleteWebSocketGateway,
} from "@modules/socketio"
import {
    socketIoKeycloakAuthMiddleware 
} from "@modules/socketio"
import {
    GlobalSearchService,
} from "./global-search"

/**
 * WebSocket gateway that streams autocomplete suggestions in real-time.
 */
@AutocompleteWebSocketGateway()
export class AutocompleteGateway {
    constructor(
        private readonly globalSearchService: GlobalSearchService,
    ) {}

    /**
     * The server instance.
     */
    @WebSocketServer()
    private readonly server: Namespace

    /**
     * After the server is initialized, use the auth middleware for the namespace.
     */
    afterInit() {
        this.server.use(socketIoKeycloakAuthMiddleware) // use the auth middleware for the namespace
    }
}
