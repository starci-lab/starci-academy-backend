/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { BullModule } from "@nestjs/bullmq"
import { NotificationEntity } from "."
import {
    NotificationsService,
    NOTIFICATION_QUEUE,
} from "."
import { NotificationsController } from "."
import { NotificationProcessor } from "."
import { RateLimitModule } from "../rate-limit"

@Module({
    imports: [
        TypeOrmModule.forFeature([NotificationEntity]),
        BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
        RateLimitModule,
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationProcessor],
})
/**
 * Class `NotificationsModule` — thành phần lab (controller/service/module).
 * (EN: Class `NotificationsModule` — lesson lab component.)
 */
export class NotificationsModule {}
