import {
    ApiProperty,
} from "@nestjs/swagger"

/**
 * Returned after the webhook signature is valid and the snapshot has been stored.
 */
export interface PayosWebhookResponse {
    ok: true
}

/**
 * OpenAPI shape for {@link PayosWebhookResponse}.
 */
export class PayosWebhookResponseDto {
    @ApiProperty(
        {
            description: "Acknowledgement after successful verification and persistence.",
            example: true,
        },
    )
        ok!: true
}
