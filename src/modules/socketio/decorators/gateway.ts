import {
    WebSocketGateway 
} from "@nestjs/websockets"
import {
    createCorsOptions 
} from "@modules/cors"

export const AUTOCOMPLETE_NAMESPACE = "autocomplete"
export const JOB_PIPELINE_NAMESPACE = "jobs"

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
 * Decorator to mark a class as a WebSocket gateway for the job pipeline namespace.
 */
export const JobPipelineWebSocketGateway = () => WebSocketGateway(
    {
        namespace: JOB_PIPELINE_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)
