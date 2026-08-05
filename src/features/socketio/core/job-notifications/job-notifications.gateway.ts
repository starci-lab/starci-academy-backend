import type {
    Namespace,
} from "socket.io"
import {
    WebSocketServer,
} from "@nestjs/websockets"
import {
    JobNotificationsWebSocketGateway,
    socketIoKeycloakAuthMiddleware,
} from "@modules/socketio"

@JobNotificationsWebSocketGateway()
/**
 * WebSocket gateway for job notifications in the `/job_notifications` namespace.
 */
export class JobNotificationsGateway {
    /**
     * The server instance.
     */
    @WebSocketServer()
    private readonly server: Namespace

    /**
     * After the server is initialized, use the auth middleware for the namespace.
     */
    afterInit() {
        this.server.use(socketIoKeycloakAuthMiddleware)
    }
}

