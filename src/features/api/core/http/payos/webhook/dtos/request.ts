import {
    IsBoolean,
    IsObject,
    IsString,
} from "class-validator"
import type {
    WebhookData 
} from "@payos/node"
/**
 * Request body payOS sends to the payment webhook endpoint.
 */
export class PayosWebhookRequest {
    @IsString()
        code!: string

    @IsString()
        desc!: string

    @IsBoolean()
        success!: boolean

    @IsObject()
        data!: WebhookData

    @IsString()
        signature!: string
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