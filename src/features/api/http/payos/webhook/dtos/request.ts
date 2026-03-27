import {
    IsBoolean,
    IsObject,
    IsString,
} from "class-validator"

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
        data!: Record<string, unknown>

    @IsString()
        signature!: string
}
