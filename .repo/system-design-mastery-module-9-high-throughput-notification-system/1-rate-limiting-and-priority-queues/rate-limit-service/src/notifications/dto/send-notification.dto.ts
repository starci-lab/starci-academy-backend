/**
 * DTO request — validation `class-validator` cho API demo.
 * (EN: Request DTO — `class-validator` rules for demo API.)
 */
import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsOptional,
} from "class-validator"
import {
    NotificationChannel,
    NotificationType,
} from ".."

/**
 * Class `SendNotificationDto` — thành phần lab (controller/service/module).
 * (EN: Class `SendNotificationDto` — lesson lab component.)
 */
export class SendNotificationDto {
    @IsString() @IsNotEmpty()
    userId: string

    @IsEnum(NotificationChannel) @IsOptional()
    channel: NotificationChannel = NotificationChannel.EMAIL

    @IsEnum(NotificationType) @IsOptional()
    type: NotificationType = NotificationType.TRANSACTIONAL

    @IsString() @IsNotEmpty()
    content: string
}
