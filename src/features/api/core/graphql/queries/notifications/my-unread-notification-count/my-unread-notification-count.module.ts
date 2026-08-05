import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-unread-notification-count.module-definition"
import {
    MyUnreadNotificationCountResolver,
} from "./my-unread-notification-count.resolver"

@Module({
    providers: [
        MyUnreadNotificationCountResolver,
    ],
})
/**
 * Wires the authenticated `myUnreadNotificationCount` badge query. Kept
 * separate from `myNotifications` so the FE can poll the badge without
 * pulling the full page.
 */
export class MyUnreadNotificationCountSingleQueryModule extends ConfigurableModuleClass {}
