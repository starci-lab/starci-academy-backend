/**
 * DTO request — validation `class-validator` cho API demo.
 * (EN: Request DTO — `class-validator` rules for demo API.)
 */
import {
    IsBoolean,
    IsObject,
    IsOptional,
    IsString,
} from "class-validator"

/**
 * Class `PublishEventDto` — lesson lab component.
 */
export class PublishEventDto {
    @IsString()
    clientMessageId!: string

    @IsString()
    type!: string

    @IsOptional()
    @IsBoolean()
    simulateFailure?: boolean

    @IsOptional()
    @IsObject()
    payload?: Record<string, string | number | boolean>
}
