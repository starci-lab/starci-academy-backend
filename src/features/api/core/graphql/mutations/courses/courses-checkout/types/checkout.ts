import type {
    CourseEntity,
    PaymentType,
    PricingPhase,
} from "@modules/databases"

/**
 * Params for pricing a multi-course cart into line items + order totals. Shared by
 * the checkout handler (to charge + persist) and the checkout-preview query (to
 * display), so the shown price always equals the charged price.
 */
export interface PriceCartParams {
    /** The buyer, whose loyalty discount + owned courses drive per-line pricing. */
    userId: string
    /** The requested course ids (de-duplicated + owned-filtered inside the service). */
    courseIds: Array<string>
}

/**
 * One priced course line of a multi-course (cart) checkout: both the LIST (pre-
 * discount) price and the CHARGED (loyalty + bundle applied) price, in VND and USD.
 * Computed once and reused to build the gateway total, the persisted
 * `transaction_items` rows, and the preview shown in the cart.
 */
export interface CartPricedLine {
    /** The course being bought on this line (loaded with pricing phases + metadata). */
    course: CourseEntity
    /** Per-course LIST (pre-discount) price in VND — the struck "before" price. */
    listVnd: number
    /** Per-course CHARGED price in VND (loyalty + bundle discount applied). */
    chargedVnd: number
    /** Per-course LIST price in USD dollars, or null when the course has no USD price. */
    listUsd: number | null
    /** Per-course CHARGED price in USD dollars, or null when the course has no USD price. */
    chargedUsd: number | null
    /** Combined loyalty + bundle discount percent applied to this line (0–100). */
    discountPercent: number
    /** The course's active pricing phase at checkout time. */
    pricingPhase: PricingPhase
}

/**
 * Result of pricing a cart: the per-course lines plus the summed order totals and
 * the bundle-bonus context. `lines` is empty when nothing is purchasable (empty
 * request or every course already owned) — each caller decides how to handle that.
 */
export interface PriceCartResult {
    /** One priced line per purchasable course (empty when nothing to buy). */
    lines: Array<CartPricedLine>
    /** Sum of every line's LIST VND price (the struck "before" order total). */
    totalListVnd: number
    /** Sum of every line's CHARGED VND price (the domestic gateway total). */
    totalChargedVnd: number
    /** Sum of every line's LIST USD price, or null when any line lacks a USD price. */
    totalListUsd: number | null
    /** Sum of every line's CHARGED USD price, or null when any line lacks a USD price. */
    totalChargedUsd: number | null
    /** Order-wide bundle bonus percent applied (0 / 5 / 10 by course count). */
    bundleBonusPercent: number
    /** Number of purchasable courses in the order (drives the bundle tier). */
    itemCount: number
}

/**
 * Params for creating the gateway checkout of a multi-course order (the summed
 * totals + order metadata). Mirrors the single-course checkout resolver but the
 * amounts are the cart totals, not one course.
 */
export interface ResolveCoursesCheckoutParams {
    /** Chosen payment provider. */
    paymentType: PaymentType
    /** Total charged amount in VND for domestic gateways (sum of every line). */
    amount: number
    /** Total charged amount in USD dollars for international gateways, or null when any line lacks a USD price. */
    priceUsd: number | null
    /** Unique order code echoed back by the gateway (also the transaction reference). */
    orderCode: number
    /** Number of courses in the order (used in the gateway description). */
    itemCount: number
    /** Success/return redirect URL supplied by the client. */
    returnUrl?: string
    /** Cancel redirect URL supplied by the client. */
    cancelUrl?: string
}

/**
 * Result of creating a gateway checkout for a multi-course order.
 */
export interface ResolveCoursesCheckoutResult {
    /** Hosted checkout URL (redirect) or form action URL (SePay). */
    checkoutUrl: string
    /** Charged amount persisted on the transaction (VND). */
    amount: number
    /** Native gateway payment id used to poll status during reconciliation (Stripe session / PayPal order / NOWPayments invoice); null for PayOS/Sepay. */
    providerPaymentId?: string
    /** JSON of signed SePay form fields the client POSTs; undefined for redirect providers. */
    checkoutFields?: string
}

/**
 * Params for signing a SePay PG one-time-payment checkout for a multi-course order.
 */
export interface BuildSepayCoursesCheckoutParams {
    /** Unique order code (SePay invoice number). */
    orderCode: number
    /** Total charged amount in VND. */
    amount: number
    /** Number of courses in the order (used in the order description). */
    itemCount: number
    /** Success redirect URL (undefined lets the client default). */
    successUrl?: string
    /** Cancel/error redirect URL (undefined lets the client default). */
    cancelUrl?: string
}
