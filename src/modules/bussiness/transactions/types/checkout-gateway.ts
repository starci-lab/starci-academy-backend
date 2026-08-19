import type {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import type {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import type {
    EntityManager,
    FindOptionsWhere,
} from "typeorm"

/** Params for resolving a provider checkout link. */
export interface ResolveCheckoutParams {
    /** Payment provider to create the checkout with. */
    paymentType: PaymentType
    /** Amount to charge for domestic gateways (PayOS / Sepay), in VND. */
    amount: number
    /** Amount to charge for international gateways (Stripe / PayPal / Crypto), in USD dollars. */
    priceUsd: number
    /** Provider order code (also stored as the transaction `referenceId`). */
    orderCode: number
    /** PayOS return URL (required for PayOS). */
    payosReturnUrl?: string
    /** PayOS cancel URL (required for PayOS). */
    payosCancelUrl?: string
    /**
     * Text embedded in the gateway's checkout description / product-name
     * fields, e.g. "AI subscription" or "Community membership". Purely
     * cosmetic -- never used to compute an amount.
     */
    productLabel: string
    /**
     * Value recorded as `tier` in {@link MissingUsdPriceException} metadata
     * when an international gateway is requested without a configured USD
     * price (the caller's actual tier id, or a fixed catalog label).
     */
    exceptionTier: string
}

/** Params for building a SePay PG one-time-payment checkout. */
export interface BuildSepayCheckoutParams {
    /** Provider order code (also the transaction `referenceId`). */
    orderCode: number
    /** Amount to charge, in VND. */
    amount: number
    /** Redirect URL on success (optional). */
    successUrl?: string
    /** Redirect URL on cancel/error (optional). */
    cancelUrl?: string
    /** Text embedded in the signed order description, e.g. "AI subscription". */
    productLabel: string
}

/** Result of creating a provider checkout link. */
export interface ResolveCheckoutResult {
    /** URL the user visits to pay (redirect for PayOS, form action for SePay PG). */
    checkoutUrl: string
    /** Final charged amount, in VND (provider may echo it back). */
    amount: number
    /** SePay PG only: JSON of signed fields to POST as a form to `checkoutUrl`. */
    checkoutFields?: string
    /**
     * Native gateway payment id used to poll status during reconciliation
     * (Stripe session id / PayPal order id / NOWPayments invoice id). Undefined
     * for PayOS/Sepay, which reconcile by `referenceId` (orderCode).
     */
    providerPaymentId?: string
}

/** Params for the shared advisory-lock + pending-order scan. */
export interface AcquirePendingTransactionParams {
    /** Entity manager bound to the caller's open transaction. */
    manager: EntityManager
    /**
     * Advisory-lock key, scoped by the caller (e.g.
     * `checkout:membership:<userId>:<paymentType>`). Different checkout
     * flows must use disjoint key namespaces so their locks never collide.
     */
    lockKey: string
    /** Full match clause for the caller's own pending-order scan. */
    where: FindOptionsWhere<TransactionEntity>
}
