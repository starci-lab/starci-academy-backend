import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./notification.module-definition"
import {
    NotificationService,
} from "./notification.service"

/**
 * Bussiness module for per-user in-app notifications (create + realtime fan-out,
 * listing, unread count, read-state mutations).
 */
@Module({
    providers: [
        NotificationService,
    ],
    exports: [
        NotificationService,
    ],
})
export class NotificationModule extends ConfigurableModuleClass {
}
