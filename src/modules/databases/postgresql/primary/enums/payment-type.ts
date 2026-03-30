import {
    createEnumType 
} from "@modules/common/utils"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * Type of payment for a course enrollment.
 */
export enum PaymentType {
    PayOS = "payos",
    Sepay = "sepay",
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
        },
    },
)