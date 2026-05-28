import {
    IsNumber,
    IsString,
    IsOptional,
} from "class-validator"
import {
    ApiProperty,
} from "@nestjs/swagger"

/**
 * SePay Payment Gateway IPN request body.
 *
 * NOTE: the exact field set is not documented by SePay PG yet, so every field
 * is optional and the handler verifies authoritatively via the order-detail
 * API (`order.retrieve`) rather than trusting this payload. The raw body is
 * logged on receipt so the field names can be finalised from a real IPN.
 */
export class SepayWebhookRequest {
    @ApiProperty({
        required: false,
        description: "Order invoice number (our transaction referenceId).",
    })
    @IsString()
    @IsOptional()
        order_invoice_number?: string

    @ApiProperty({
        required: false,
        description: "Payment status reported by SePay (e.g. PAID/SUCCESS).",
    })
    @IsString()
    @IsOptional()
        status?: string

    @ApiProperty({
        required: false,
        description: "Amount reported by SePay.",
    })
    @IsNumber()
    @IsOptional()
        order_amount?: number

    @ApiProperty({
        required: false,
        description: "Signature SePay computed over the IPN fields.",
    })
    @IsString()
    @IsOptional()
        signature?: string
}
