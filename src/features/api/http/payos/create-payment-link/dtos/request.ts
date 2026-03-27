import {
    Type,
} from "class-transformer"
import {
    IsInt,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    Min,
} from "class-validator"

/**
 * Body for POST create payment link.
 */
export class CreatePaymentLinkRequest {
    @Type(() => Number)
    @IsInt()
    @Min(1)
        orderCode!: number

    @Type(() => Number)
    @IsInt()
    @Min(1)
        amount!: number

    @IsString()
    @MaxLength(255)
        description!: string

    @IsUrl(
        {
            require_tld: false,
        },
    )
        returnUrl!: string

    @IsUrl(
        {
            require_tld: false,
        },
    )
        cancelUrl!: string

    @IsOptional()
    @IsString()
        buyerName?: string

    @IsOptional()
    @IsString()
        buyerEmail?: string

    @IsOptional()
    @IsString()
        buyerPhone?: string

    @IsOptional()
    @Type(() => Number)
    @IsInt()
        expiredAt?: number
}
