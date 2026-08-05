import {
    IsObject,
    IsOptional,
    IsString,
} from "class-validator"
import {
    ApiProperty,
} from "@nestjs/swagger"

/**
 * SePay PG IPN `order` object. The real notification nests the order details
 * (incl. `order_invoice_number` = our transaction referenceId) under `order`.
 */
export class SepayWebhookOrder {
    @ApiProperty({
        required: false,
        description: "Order invoice number (our transaction referenceId).",
    })
    @IsString()
    @IsOptional()
        order_invoice_number?: string

    @ApiProperty({
        required: false,
        description: "Order amount as a string (e.g. \"16625.00\").",
    })
    @IsString()
    @IsOptional()
        order_amount?: string

    @ApiProperty({
        required: false,
        description: "Order status (e.g. CAPTURED / PAID).",
    })
    @IsString()
    @IsOptional()
        order_status?: string
}

/**
 * SePay Payment Gateway IPN request body (shape confirmed from a live IPN):
 * `{ notification_type, order: { order_invoice_number, order_status, ... },
 *    transaction: {...} }`. All fields optional -- the handler verifies
 * authoritatively via the order-detail API (`order.retrieve`).
 */
export class SepayWebhookRequest {
    @ApiProperty({
        required: false,
        description: "Notification type (e.g. ORDER_PAID).",
    })
    @IsString()
    @IsOptional()
        notification_type?: string

    @ApiProperty({
        required: false,
        type: SepayWebhookOrder,
        description: "Nested order object carrying the invoice number + status.",
    })
    @IsObject()
    @IsOptional()
        order?: SepayWebhookOrder

    @ApiProperty({
        required: false,
        description: "Top-level invoice number (legacy/fallback shape).",
    })
    @IsString()
    @IsOptional()
        order_invoice_number?: string
}
