import type {
    NowPaymentsWebhookRequest,
} from "../dtos"

/** NOWPayments IPN body + the HMAC signature header needed to verify it. */
export interface NowPaymentsWebhookParams {
    /** Parsed IPN body NOWPayments posted. */
    body: NowPaymentsWebhookRequest
    /** `x-nowpayments-sig` header (HMAC-SHA512 of the sorted body). */
    signature: string
}
