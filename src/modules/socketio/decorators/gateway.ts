import {
    WebSocketGateway 
} from "@nestjs/websockets"
import {
    createCorsOptions 
} from "@modules/cors"

export const CALLBACK_NAMESPACE = "callback"
export const DEMO_NAMESPACE = "demo"

export const CallbackWebSocketGateway = () => WebSocketGateway(
    {
        namespace: CALLBACK_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)

export const DemoWebSocketGateway = () => WebSocketGateway(
    {
        namespace: DEMO_NAMESPACE,
        transports: [
            "websocket",
            "polling"
        ],
        cors: createCorsOptions(),
        perMessageDeflate: true,
    }
)
