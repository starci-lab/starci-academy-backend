import {
    WebSocketGateway 
} from "@nestjs/websockets"
import {
    createCorsOptions 
} from "@modules/cors"

export const AUTOCOMPLETE_NAMESPACE = "autocomplete"
export const JOB_NOTIFICATIONS_NAMESPACE = "job_notifications"

/**
 * Decorator to mark a class as a WebSocket gateway for the autocomplete namespace.
 */
export const AutocompleteWebSocketGateway = () => WebSocketGateway(
    {
        namespace: AUTOCOMPLETE_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)

/**
 * Decorator to mark a class as a WebSocket gateway for the job notifications namespace.
 */
export const JobNotificationsWebSocketGateway = () => WebSocketGateway(
    {
        namespace: JOB_NOTIFICATIONS_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)