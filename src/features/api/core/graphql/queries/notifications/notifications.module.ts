import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./notifications.module-definition"
import {
    MyNotificationsSingleQueryModule,
} from "./my-notifications/my-notifications.module"
import {
    MyUnreadNotificationCountSingleQueryModule,
} from "./my-unread-notification-count/my-unread-notification-count.module"

@Module({
    imports: [
        MyNotificationsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyUnreadNotificationCountSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Per-user notifications query group (bell list + unread badge count).
 */
export class NotificationsQueriesModule extends ConfigurableModuleClass {}
