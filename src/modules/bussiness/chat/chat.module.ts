import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./chat.module-definition"
import {
    ChatService,
} from "./chat.service"

/**
 * Bussiness module for community chat (community room + founder DM threads).
 * Depends on the globally-provided MembershipService (member gate).
 */
@Module({
    providers: [
        ChatService,
    ],
    exports: [
        ChatService,
    ],
})
export class ChatModule extends ConfigurableModuleClass {}
