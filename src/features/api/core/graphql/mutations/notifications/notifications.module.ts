import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./notifications.module-definition"
import {
    MarkNotificationAsReadSingleMutationModule,
} from "./mark-notification-as-read/mark-notification-as-read.module"
import {
    MarkAllNotificationsAsReadSingleMutationModule,
} from "./mark-all-notifications-as-read/mark-all-notifications-as-read.module"

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
/**
 * Per-user notifications mutation group (mark one / mark all as read).
 */
export class NotificationsMutationsModule extends ConfigurableModuleClass {}
