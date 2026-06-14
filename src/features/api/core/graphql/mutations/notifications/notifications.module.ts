import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./notifications.module-definition"
import {
    MarkNotificationAsReadSingleMutationModule,
} from "./mark-notification-as-read"
import {
    MarkAllNotificationsAsReadSingleMutationModule,
} from "./mark-all-notifications-as-read"

/**
 * Per-user notifications mutation group (mark one / mark all as read).
 */
@Module({
    imports: [
        MarkNotificationAsReadSingleMutationModule.register({
            isGlobal: true,
        }),
        MarkAllNotificationsAsReadSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class NotificationsMutationsModule extends ConfigurableModuleClass {}
