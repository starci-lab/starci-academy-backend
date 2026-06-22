/** Params for creating a PayPal order (one-time payment). */
export interface CreatePaypalOrderParams {
    /** Amount to charge (major units, e.g. dollars), formatted to 2 decimals downstream. */
    amount: number
    /** Our reference id (also the transaction `referenceId`); sent as `custom_id`. */
    referenceId: string
    /** Human-readable order description shown on the PayPal approval page. */
    description: string
    /** URL PayPal redirects to after the buyer approves. */
    returnUrl: string
    /** URL PayPal redirects to when the buyer cancels. */
    cancelUrl: string
}

/** Result of creating a PayPal order. */
export interface CreatePaypalOrderResult {
    /** PayPal order id (used later to look up / capture the order). */
    orderId: string
    /** Approval URL the buyer is redirected to in order to pay. */
    approveUrl: string
}

/** Params for verifying a PayPal webhook signature via the REST API. */
export interface VerifyPaypalWebhookParams {
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
    /** The raw parsed webhook event body PayPal posted. */
    webhookEvent: Record<string, unknown>
}

/** Params for fetching a PayPal order's detail. */
export interface RetrievePaypalOrderParams {
    /** PayPal order id to look up. */
    orderId: string
}

/** Params for capturing the funds of an approved PayPal order. */
export interface CapturePaypalOrderParams {
    /** PayPal order id to capture (must be in `APPROVED` state). */
    orderId: string
}

/** Result of capturing a PayPal order. */
export interface CapturePaypalOrderResult {
    /** PayPal order id. */
    id: string
    /** Order status after the capture attempt (`COMPLETED` when funds were taken). */
    status: string
    /** Our reference id echoed back via `purchase_units[].custom_id`. */
    referenceId?: string
    /** Whether the funds are now captured (status `COMPLETED`, or already captured). */
    captured: boolean
}

/** A HATEOAS link entry returned on a PayPal order (`response.data.links[]`). */
export interface PaypalLink {
    /** Relation name of the link (e.g. `approve`, `self`, `capture`). */
    rel: string
    /** Absolute URL the relation points to. */
    href: string
}

/** Subset of a PayPal `purchase_units[]` entry we rely on. */
export interface PaypalPurchaseUnit {
    /** Our reference id echoed back by PayPal on the purchase unit. */
    custom_id?: string
}

/** Subset of a PayPal order detail response we rely on. */
export interface PaypalOrderDetail {
    /** PayPal order id. */
    id: string
    /** Order status (e.g. `APPROVED`, `COMPLETED`). */
    status: string
    /** Our reference id echoed back via `purchase_units[].custom_id`. */
    referenceId?: string
}
