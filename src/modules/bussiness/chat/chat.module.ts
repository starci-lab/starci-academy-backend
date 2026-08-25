import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./chat.module-definition"
import {
    ChatService 
} from "./chat.service"
import {
    GlobalChatMetricsService 
} from "./global-chat-metrics.service"
import {
    GlobalChatPolicyService 
} from "./global-chat-policy.service"
import {
    GlobalChatService 
} from "./global-chat.service"

@Module({
    providers: [
        ChatService,
        GlobalChatService,
        GlobalChatPolicyService,
        GlobalChatMetricsService,
    ],
    exports: [
        ChatService,
        GlobalChatService,
        GlobalChatPolicyService,
        GlobalChatMetricsService,
    ],
})
/**
 * Bussiness module for community chat (community room + founder DM threads).
 * Depends on the globally-provided MembershipService (member gate).
 */
export class ChatModule extends ConfigurableModuleClass {}
