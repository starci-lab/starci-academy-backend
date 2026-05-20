import {
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from "class-validator"

/**
 * Payload ghi dữ liệu theo quorum.
 * (EN: Quorum write payload.)
 */
export class QuorumWriteDto {
    @IsString()
    @IsNotEmpty()
    key!: string

    @IsString()
    @IsNotEmpty()
    value!: string

    @IsNumber()
    @Min(1)
    w!: number

    @IsNumber()
    @Min(1)
    r!: number
}
