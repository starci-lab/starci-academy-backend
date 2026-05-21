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
} from ".."

/**
 * DTO đầu vào để gửi thông báo — validate userId, channel, content.
 * (EN: Input DTO to send a notification — validates userId, channel, content.)
 */
export class SendNotificationDto {
    @IsString()
    @IsNotEmpty()
    userId: string

    @IsEnum(NotificationChannel)
    @IsOptional()
    channel: NotificationChannel = NotificationChannel.EMAIL

    @IsString()
    @IsNotEmpty()
    content: string
}
