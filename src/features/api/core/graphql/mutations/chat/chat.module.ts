import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./chat.module-definition"
import {
    SendChatMessageResolver 
} from "./send-chat-message/send-chat-message.resolver"
import {
    SendChatMessageService 
} from "./send-chat-message/send-chat-message.service"
import {
    GlobalChatMutationResolver 
} from "./global-chat/global-chat.resolver"
import {
    GlobalChatMutationService 
} from "./global-chat/global-chat.service"

@Module({
    providers: [
        SendChatMessageResolver,
        SendChatMessageService,
        GlobalChatMutationResolver,
        GlobalChatMutationService,
    ],
})
/**
 * Aggregates the write-side (mutation) resolvers of the community chat feature.
 */
export class ChatMutationsModule extends ConfigurableModuleClass {}
