import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./community-chat.module-definition"
import {
    CommunityChatGateway,
} from "./community-chat.gateway"
import {
    CommunityChatRoomService,
} from "./community-chat-room.service"

/**
 * Module providing the Socket.IO community chat gateway (per-conversation message
 * realtime).
 */
@Module({
    providers: [
        CommunityChatGateway,
        CommunityChatRoomService,
    ],
    exports: [
        CommunityChatGateway,
        CommunityChatRoomService,
    ],
})
export class CommunityChatModule extends ConfigurableModuleClass {}
