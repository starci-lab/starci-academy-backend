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
import { NotificationChannel } from ".."

/**
 * Class `DispatchNotificationDto` — thành phần lab (controller/service/module).
 * (EN: Class `DispatchNotificationDto` — lesson lab component.)
 */
export class DispatchNotificationDto {
    /** Idempotency key — client tạo UUID duy nhất cho mỗi request. */
    @IsString() @IsNotEmpty()
    idempotencyKey: string

    @IsString() @IsNotEmpty()
    userId: string

    @IsEnum(NotificationChannel) @IsOptional()
    channel: NotificationChannel = NotificationChannel.EMAIL

    @IsString() @IsNotEmpty()
    content: string
}
