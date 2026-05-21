/**
 * DTO request — validation `class-validator` cho API demo.
 * (EN: Request DTO — `class-validator` rules for demo API.)
 */
import {
    IsObject,
    IsOptional,
    IsString,
} from "class-validator"

/**
 * Class `PublishEventDto` — thành phần lab (controller/service/module).
 * (EN: Class `PublishEventDto` — lesson lab component.)
 */
export class PublishEventDto {
    @IsOptional()
    @IsString()
        partitionKey?: string

    @IsString()
        type!: string

    @IsObject()
        payload!: Record<string, string | number | boolean>
}
