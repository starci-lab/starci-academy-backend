/**
 * DTO request — validation `class-validator` cho API demo.
 * (EN: Request DTO — `class-validator` rules for demo API.)
 */
import {
    IsString,
    IsNotEmpty,
} from "class-validator"

/**
 * Yêu cầu DTO đầu vào để xử lý thao tác.
 * (EN: Input DTO validating request payload.)
 */
export class CreateNotificationsDto {
    @IsString()
    @IsNotEmpty()
    title: string
}
