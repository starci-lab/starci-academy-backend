import {
    PaymentType,
} from "@modules/databases"

/** The currency a `PaymentType` gateway settles in. */
export type PaymentCurrency = "VND" | "USD"

/**
 * What one `PaymentType` gateway can do with the two optional checkout
 * modifiers (a Coin-shop voucher, an installment plan).
 */
export interface PaymentModifierCapability {
    /** The currency this gateway charges (VND gateways vs USD gateways). */
    currency: PaymentCurrency
    /** Whether a `VoucherDiscountType.Percent` voucher can be applied here. */
    supportsVoucherPercent: boolean
    /** Whether a `VoucherDiscountType.Flat` (VND-denominated) voucher can be applied here. */
    supportsVoucherFlat: boolean
    /** Whether `installmentMonths` (installment plan) can be selected with this gateway. */
    supportsInstallment: boolean
}

/**
 * SSOT capability matrix for the two optional checkout modifiers
 * (`voucherCode`, `installmentMonths`), keyed by `PaymentType` -- see
 * `.artifacts/states/transactions/business.md` § "Payment-modifier capability
 * model" for the full design decision (2026-08-04).
 *
 * The five gateways split on a **currency axis**: PayOS/Sepay charge VND;
 * Stripe/PayPal/Crypto charge an explicit USD price (no runtime FX). That
 * split drives every capability below:
 *
 * - Voucher **Percent** (`amount x (1 − value/100)`) is currency-agnostic, so
 *   it is honoured everywhere.
 * - Voucher **Flat** (`amount − value`, value denominated in VND) is
 *   currency-bound -- VND gateways only. Never FX-converted onto a USD charge.
 * - **Installment** (installment plan) needs a domestic recurring collection for its
 *   later cycles (`pay-next-installment` is PayOS/Sepay only) -- VND gateways only.
 *
 * Every caller that decides whether a modifier is allowed on a gateway MUST
 * read this matrix instead of hand-rolling the currency check -- this is the
 * single source of truth. An unsupported modifier is rejected loudly (a typed
 * exception) before any row or checkout is created; it is never silently
 * dropped and never FX-converted.
 */
export const PAYMENT_MODIFIER_CAPABILITY: Readonly<Record<PaymentType, PaymentModifierCapability>> = {
    [PaymentType.PayOS]: {
        currency: "VND",
        supportsVoucherPercent: true,
        supportsVoucherFlat: true,
        supportsInstallment: true,
    },
    [PaymentType.Sepay]: {
        currency: "VND",
        supportsVoucherPercent: true,
        supportsVoucherFlat: true,
        supportsInstallment: true,
    },
    [PaymentType.Stripe]: {
        currency: "USD",
        supportsVoucherPercent: true,
        supportsVoucherFlat: false,
        supportsInstallment: false,
    },
    [PaymentType.Paypal]: {
        currency: "USD",
        supportsVoucherPercent: true,
        supportsVoucherFlat: false,
        supportsInstallment: false,
    },
    [PaymentType.Crypto]: {
        currency: "USD",
        supportsVoucherPercent: true,
        supportsVoucherFlat: false,
        supportsInstallment: false,
    },
}
