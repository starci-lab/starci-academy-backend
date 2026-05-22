/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    BullModule,
} from "@nestjs/bullmq"
import {
    NotificationEntity,
} from "../entities"
import {
    NotificationsService,
    NOTIFICATION_QUEUE,
} from "."
import {
    NotificationsController,
} from "."
import {
    NotificationProcessor,
} from "."

/**
 * Feature Module quản lý bài học Notification System Architecture.
 * Đăng ký TypeORM entity, BullMQ queue, controller, service, và processor.
 * (EN: Feature Module managing lesson Notification System Architecture.
 * Registers TypeORM entity, BullMQ queue, controller, service, and processor.)
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([NotificationEntity]),
        BullModule.registerQueue({
            name: NOTIFICATION_QUEUE,
        }),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationProcessor],
    exports: [NotificationsService],
})
/**
 * Class `NotificationsModule` — thành phần lab (controller/service/module).
 * (EN: Class `NotificationsModule` — lesson lab component.)
 */
export class NotificationsModule {}
