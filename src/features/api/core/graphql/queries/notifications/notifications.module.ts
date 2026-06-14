import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./notifications.module-definition"
import {
    MyNotificationsSingleQueryModule,
} from "./my-notifications"
import {
    MyUnreadNotificationCountSingleQueryModule,
} from "./my-unread-notification-count"

/**
 * Per-user notifications query group (bell list + unread badge count).
 */
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
export class NotificationsQueriesModule extends ConfigurableModuleClass {}
