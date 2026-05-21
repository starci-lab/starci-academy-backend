/**
 * DTO tạo người dùng — validate name (string, ≥ 1 ký tự) và email.
 * (EN: Create user DTO — validates name (string, ≥ 1 char) and email.)
 */
import {
    IsEmail,
    IsString,
    MinLength,
} from "class-validator"

/**
 * Class `CreateUserDto` — thành phần lab (controller/service/module).
 * (EN: Class `CreateUserDto` — lesson lab component.)
 */
export class CreateUserDto {
    @IsString()
    @MinLength(1)
    name!: string

    @IsEmail()
    email!: string
}
