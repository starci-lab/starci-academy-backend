import {
    Module,
} from "@nestjs/common"
import {
    SocketioRealtimeChatGateway,
} from "./socketio-realtime-chat.gateway"

@Module({
    providers: [SocketioRealtimeChatGateway],
})
/** Lesson module bundling the `0-socketio-realtime-chat` namespace gateway. */
export class SocketioRealtimeChatMockModule {}
