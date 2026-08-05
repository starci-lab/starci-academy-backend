import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * Type of payment for a course enrollment.
 */
export enum PaymentType {
    /** Vietnamese gateway PayOS (redirect checkout). */
    PayOS = "payos",
    /** Vietnamese gateway SePay (form-POST checkout). */
    Sepay = "sepay",
    /** International card gateway Stripe (redirect Checkout Session). */
    Stripe = "stripe",
    /** International gateway PayPal (redirect approval link). */
    Paypal = "paypal",
    /** Crypto gateway NOWPayments -- USDT / USDC (redirect invoice). */
    Crypto = "crypto",
}

/**
 * GraphQL type for the payment type enum.
 */
export const GraphQLTypePaymentType = createEnumType(PaymentType)

/**
 * Register the payment type enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypePaymentType,
    {
        name: "PaymentType",
        description: "The type of payment.",
        valuesMap: {
            [PaymentType.PayOS]: {
                description: "The payment is via PayOS.",
            },
            [PaymentType.Sepay]: {
                description: "The payment is via Sepay.",
            },
            [PaymentType.Stripe]: {
                description: "The payment is via Stripe.",
            },
            [PaymentType.Paypal]: {
                description: "The payment is via PayPal.",
            },
            [PaymentType.Crypto]: {
                description: "The payment is via NOWPayments crypto (USDT/USDC).",
            },
        },
    },
)