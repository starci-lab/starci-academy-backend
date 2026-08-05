import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./chat.module-definition"
import {
    ChatService,
} from "./chat.service"

@Module({
    providers: [
        ChatService,
    ],
    exports: [
        ChatService,
    ],
})
/**
 * Bussiness module for community chat (community room + founder DM threads).
 * Depends on the globally-provided MembershipService (member gate).
 */
export class ChatModule extends ConfigurableModuleClass {}
