import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./mark-all-notifications-as-read.module-definition"
import {
    MarkAllNotificationsAsReadResolver,
} from "./mark-all-notifications-as-read.resolver"

@Module({
    providers: [
        MarkAllNotificationsAsReadResolver,
    ],
})
/**
 * Registers the bulk mark-read write -- kept distinct from single-id mark
 * so a mistaken client call cannot wipe the inbox via the wrong leaf.
 */
export class MarkAllNotificationsAsReadSingleMutationModule extends ConfigurableModuleClass {}
