import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./realtime.module-definition"
import {
    SocketioRealtimeChatMockModule,
} from "./0-socketio-realtime-chat/socketio-realtime-chat.module"
import {
    SocketioSecurityJwtMockModule,
} from "./1-socketio-security-jwt/socketio-security-jwt.module"
import {
    PresenceMockModule,
} from "./2-presence-and-typing-indicators/presence.module"
import {
    ReconnectionMockModule,
} from "./3-reconnection-and-missed-messages/reconnection.module"

@Module({
    imports: [
        SocketioRealtimeChatMockModule,
        SocketioSecurityJwtMockModule,
        PresenceMockModule,
        ReconnectionMockModule,
    ],
})
/**
 * Aggregator module for the realtime (WebSocket) sandbox lessons.
 *
 * Each lesson owns its own Socket.IO namespace gateway (and, where needed, a REST
 * controller) so their event contracts stay isolated while sharing the single
 * mock HTTP/WS port (3002) and the cloudflared tunnel (`wss://mock.starci.org`).
 */
export class RealtimeMockModule extends ConfigurableModuleClass {}
