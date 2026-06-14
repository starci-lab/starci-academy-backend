import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./notifications.module-definition"
import {
    NotificationsGateway,
} from "./notifications.gateway"
import {
    NotificationRoomService,
} from "./notification-room.service"

/**
 * Module providing the Socket.IO notifications gateway (per-user bell realtime).
 */
@Module({
    providers: [
        NotificationsGateway,
        NotificationRoomService,
    ],
    exports: [
        NotificationsGateway,
        NotificationRoomService,
    ],
})
export class NotificationsModule extends ConfigurableModuleClass {}
