import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./mark-notification-as-read.module-definition"
import {
    MarkNotificationAsReadResolver,
} from "./mark-notification-as-read.resolver"

@Module({
    providers: [
        MarkNotificationAsReadResolver,
    ],
})
/**
 * Registers the single-notification mark-read write so inbox state changes
 * stay a Nest unit under the notifications aggregator.
 */
export class MarkNotificationAsReadSingleMutationModule extends ConfigurableModuleClass {}
