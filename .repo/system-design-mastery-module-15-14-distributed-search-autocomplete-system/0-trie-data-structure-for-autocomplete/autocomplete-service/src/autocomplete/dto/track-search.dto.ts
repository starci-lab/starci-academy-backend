import {
    IsNotEmpty,
    IsString,
} from "class-validator"

/**
 * Payload ghi nhận truy vấn tìm kiếm.
 * (EN: Search tracking payload.)
 */
export class TrackSearchDto {
    @IsString()
    @IsNotEmpty()
    query!: string
}
