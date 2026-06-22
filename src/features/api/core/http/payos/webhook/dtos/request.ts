import {
    IsBoolean,
    IsObject,
    IsOptional,
    IsString,
} from "class-validator"
import type {
    WebhookData
} from "@payos/node"
/**
 * Request body payOS sends to the payment webhook endpoint.
 *
 * All fields are optional so the global ValidationPipe never rejects a payload
 * before the handler runs — PayOS's webhook-URL confirmation probe omits some
 * fields (e.g. `success`), and the handler verifies the signature + `code`
 * authoritatively anyway (mirrors the SePay / NOWPayments webhook DTOs).
 */
export class PayosWebhookRequest {
    @IsString()
    @IsOptional()
        code?: string

    @IsString()
    @IsOptional()
        desc?: string

    @IsBoolean()
    @IsOptional()
        success?: boolean

    @IsObject()
    @IsOptional()
        data?: WebhookData

    @IsString()
    @IsOptional()
        signature?: string
}

/**
 * Data object from payOS webhook.
 */
export class PayosWebhookData {
    @IsString()
        orderCode!: string

    @IsString()
        amount!: string
}