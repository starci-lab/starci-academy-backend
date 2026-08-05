import type {
    PaypalWebhookRequest,
} from "../dtos/webhook.request"

/** PayPal webhook body + the signature headers needed to verify it. */
export interface PaypalWebhookParams {
    /** Parsed webhook event body PayPal posted. */
    body: PaypalWebhookRequest
    /** `paypal-auth-algo` header. */
    authAlgo: string
    /** `paypal-cert-url` header. */
    certUrl: string
    /** `paypal-transmission-id` header. */
    transmissionId: string
    /** `paypal-transmission-sig` header. */
    transmissionSig: string
    /** `paypal-transmission-time` header. */
    transmissionTime: string
}
