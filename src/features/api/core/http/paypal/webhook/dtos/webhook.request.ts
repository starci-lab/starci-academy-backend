import {
    IsObject,
    IsOptional,
    IsString,
} from "class-validator"
import {
    ApiProperty,
} from "@nestjs/swagger"

/**
 * PayPal webhook event body. PayPal posts an event envelope; the relevant data
 * (order/capture + our `custom_id`) lives under `resource`. The handler verifies
 * the signature authoritatively via the verify-webhook-signature API rather than
 * trusting the body, so most fields are optional.
 */
export class PaypalWebhookRequest {
    @ApiProperty({
        required: false,
        description: "PayPal event id.",
    })
    @IsString()
    @IsOptional()
        id?: string

    @ApiProperty({
        required: false,
        description: "Event type, e.g. CHECKOUT.ORDER.APPROVED / PAYMENT.CAPTURE.COMPLETED.",
    })
    @IsString()
    @IsOptional()
        event_type?: string

    @ApiProperty({
        required: false,
        description: "Event resource payload (order/capture) — carries our custom_id.",
    })
    @IsObject()
    @IsOptional()
        resource?: Record<string, unknown>
}
