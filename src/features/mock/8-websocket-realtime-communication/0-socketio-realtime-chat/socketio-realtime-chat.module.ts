import {
    Module,
} from "@nestjs/common"
import {
    SocketioRealtimeChatGateway,
} from "./socketio-realtime-chat.gateway"

/** Lesson module bundling the `0-socketio-realtime-chat` namespace gateway. */
@Module({
    providers: [SocketioRealtimeChatGateway],
})
export class SocketioRealtimeChatMockModule {}
