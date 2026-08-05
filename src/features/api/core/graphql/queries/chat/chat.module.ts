import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./chat.module-definition"
import {
    CommunityChatConversationResolver,
} from "./community-chat-conversation/community-chat-conversation.resolver"
import {
    CommunityChatConversationService,
} from "./community-chat-conversation/community-chat-conversation.service"
import {
    MyFounderConversationResolver,
} from "./my-founder-conversation/my-founder-conversation.resolver"
import {
    MyFounderConversationService,
} from "./my-founder-conversation/my-founder-conversation.service"
import {
    ChatMessagesResolver,
} from "./chat-messages/chat-messages.resolver"
import {
    ChatMessagesService,
} from "./chat-messages/chat-messages.service"

@Module({
    providers: [
        CommunityChatConversationResolver,
        CommunityChatConversationService,
        MyFounderConversationResolver,
        MyFounderConversationService,
        ChatMessagesResolver,
        ChatMessagesService,
    ],
})
/**
 * Aggregates the read-side (query) resolvers of the community chat feature.
 */
export class ChatQueriesModule extends ConfigurableModuleClass {}
