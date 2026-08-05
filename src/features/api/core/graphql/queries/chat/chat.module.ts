import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./chat.module-definition"
import {
    CommunityChatConversationResolver,
    CommunityChatConversationService,
} from "./community-chat-conversation"
import {
    MyFounderConversationResolver,
    MyFounderConversationService,
} from "./my-founder-conversation"
import {
    ChatMessagesResolver,
    ChatMessagesService,
} from "./chat-messages"

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
