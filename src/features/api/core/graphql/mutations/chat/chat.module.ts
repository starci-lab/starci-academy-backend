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
