import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-notifications.module-definition"
import {
    MyNotificationsResolver,
} from "./my-notifications.resolver"

@Module({
    providers: [
        MyNotificationsResolver,
    ],
})
/**
 * Wires the authenticated `myNotifications` bell list (paginated, unread
 * total folded in). Resolver-only and uncached — the bell is read on
 * demand, not from a projection.
 */
export class MyNotificationsSingleQueryModule extends ConfigurableModuleClass {}
