import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./chat.module-definition"
import {
    SendChatMessageResolver,
} from "./send-chat-message/send-chat-message.resolver"
import {
    SendChatMessageService,
} from "./send-chat-message/send-chat-message.service"

@Module({
    providers: [
        SendChatMessageResolver,
        SendChatMessageService,
    ],
})
/**
 * Aggregates the write-side (mutation) resolvers of the community chat feature.
 */
export class ChatMutationsModule extends ConfigurableModuleClass {}
