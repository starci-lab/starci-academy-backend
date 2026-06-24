import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./chat.module-definition"
import {
    SendChatMessageResolver,
    SendChatMessageService,
} from "./send-chat-message"

/**
 * Aggregates the write-side (mutation) resolvers of the community chat feature.
 */
@Module({
    providers: [
        SendChatMessageResolver,
        SendChatMessageService,
    ],
})
export class ChatMutationsModule extends ConfigurableModuleClass {}
