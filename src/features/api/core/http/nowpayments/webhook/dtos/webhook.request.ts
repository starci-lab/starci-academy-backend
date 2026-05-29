import {
    IsNumber,
    IsOptional,
    IsString,
} from "class-validator"
import {
    ApiProperty,
} from "@nestjs/swagger"

/**
 * NOWPayments IPN callback body. The handler verifies the body authoritatively
 * via HMAC-SHA512 of the sorted payload against the IPN secret, so fields are
 * optional and not trusted until verified.
 */
export class NowPaymentsWebhookRequest {
    @ApiProperty({
        required: false,
        description: "NOWPayments payment id.",
    })
    @IsNumber()
    @IsOptional()
        payment_id?: number

    @ApiProperty({
        required: false,
        description: "Payment status, e.g. waiting / confirming / finished / failed.",
    })
    @IsString()
    @IsOptional()
        payment_status?: string

    @ApiProperty({
        required: false,
        description: "Our order id (the transaction referenceId) echoed back.",
    })
    @IsString()
    @IsOptional()
        order_id?: string

    @ApiProperty({
        required: false,
        description: "Crypto asset the customer paid in.",
    })
    @IsString()
    @IsOptional()
        pay_currency?: string

    @ApiProperty({
        required: false,
        description: "Fiat price amount quoted on the invoice.",
    })
    @IsNumber()
    @IsOptional()
        price_amount?: number
}
