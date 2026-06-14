import {
    WebSocketGateway 
} from "@nestjs/websockets"
import {
    createCorsOptions 
} from "@modules/cors"

export const AUTOCOMPLETE_NAMESPACE = "autocomplete"
export const JOB_NOTIFICATIONS_NAMESPACE = "job_notifications"
export const CONTENT_DISCUSSION_NAMESPACE = "content_discussion"
export const AI_LAB_NAMESPACE = "ai_lab"
export const NOTIFICATIONS_NAMESPACE = "notifications"

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

/**
 * Decorator to mark a class as a WebSocket gateway for the content discussion namespace.
 */
export const ContentDiscussionWebSocketGateway = () => WebSocketGateway(
    {
        namespace: CONTENT_DISCUSSION_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)

/**
 * Decorator to mark a class as a WebSocket gateway for the AI Lab namespace
 * (playground prompt token streaming).
 */
export const AiLabWebSocketGateway = () => WebSocketGateway(
    {
        namespace: AI_LAB_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)

/**
 * Decorator to mark a class as a WebSocket gateway for the per-user in-app
 * notifications namespace (bell realtime).
 */
export const NotificationsWebSocketGateway = () => WebSocketGateway(
    {
        namespace: NOTIFICATIONS_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)