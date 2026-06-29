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
export const COMMUNITY_FEED_NAMESPACE = "community_feed"
export const COMMUNITY_CHAT_NAMESPACE = "community_chat"
export const CONTENT_AI_NAMESPACE = "content_ai"
export const SYSTEM_HEALTH_NAMESPACE = "system_health"

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

/**
 * Decorator to mark a class as a WebSocket gateway for the community feed
 * namespace (post/comment/reaction realtime fan-out).
 */
export const CommunityFeedWebSocketGateway = () => WebSocketGateway(
    {
        namespace: COMMUNITY_FEED_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)

/**
 * Decorator to mark a class as a WebSocket gateway for the community chat
 * namespace (per-conversation message realtime fan-out).
 */
export const CommunityChatWebSocketGateway = () => WebSocketGateway(
    {
        namespace: COMMUNITY_CHAT_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)

/**
 * Decorator to mark a class as a WebSocket gateway for the content-AI namespace
 * (grounded lesson Q&A answer token streaming).
 */
export const ContentAiWebSocketGateway = () => WebSocketGateway(
    {
        namespace: CONTENT_AI_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)

/**
 * Decorator to mark a class as a WebSocket gateway for the system-health
 * namespace (public per-model AI latency snapshot broadcast — no auth).
 */
export const SystemHealthWebSocketGateway = () => WebSocketGateway(
    {
        namespace: SYSTEM_HEALTH_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)