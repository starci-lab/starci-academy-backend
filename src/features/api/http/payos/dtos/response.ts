import {
    ApiProperty,
    ApiPropertyOptional,
} from "@nestjs/swagger"
import type {
    PayOS,
} from "@payos/node"

/**
 * payOS merchant API response envelope (`/v2/payment-requests`, etc.).
 */
export class PayosMerchantApiResponseDto {
    @ApiProperty(
        {
            description: "Result code from payOS (e.g. \"00\" for success).",
            example: "00",
        },
    )
        code!: string

    @ApiProperty(
        {
            description: "Human-readable result description.",
            example: "success",
        },
    )
        desc!: string

    @ApiPropertyOptional(
        {
            description: "Response payload (payment link, status, etc.).",
            type: "object",
            additionalProperties: true,
        },
    )
        data?: Record<string, unknown>

    @ApiPropertyOptional(
        {
            description: "Response signature when returned by payOS.",
        },
    )
        signature?: string
}

/**
 * Response from POST create payment link.
 */
export type CreatePaymentLinkResponse = PayosMerchantApiResponseDto

/**
 * Return type of {@link PayOS#paymentRequests#get} (SDK).
 */
export type GetPaymentRequestResponse = Awaited<
    ReturnType<PayOS["paymentRequests"]["get"]>
>
