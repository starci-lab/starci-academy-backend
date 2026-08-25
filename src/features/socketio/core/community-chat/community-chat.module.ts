import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./community-chat.module-definition"
import {
    CommunityChatGateway 
} from "./community-chat.gateway"
import {
    CommunityChatRoomService 
} from "./community-chat-room.service"
import {
    GlobalChatOutboxPublisherService 
} from "./global-chat-outbox-publisher.service"

@Module({
    providers: [
        CommunityChatGateway,
        CommunityChatRoomService,
        GlobalChatOutboxPublisherService,
    ],
    exports: [
        CommunityChatGateway,
        CommunityChatRoomService,
        GlobalChatOutboxPublisherService,
    ],
})
/**
 * Module providing the Socket.IO community chat gateway (per-conversation message
 * realtime).
 */
export class CommunityChatModule extends ConfigurableModuleClass {}
