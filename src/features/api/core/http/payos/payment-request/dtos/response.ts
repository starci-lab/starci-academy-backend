import {
    AbstractRestResponse 
} from "@modules/api"
import {
    ApiProperty 
} from "@nestjs/swagger"
import type {
    PaymentLinkStatus 
} from "@payos/node"

/**
 * Response from GET transaction.
 */
export class PaymentRequestTransactionResponseData {
    @ApiProperty({
        description: "The reference of the transaction.",
        example: "1234567890",
    })
    readonly reference: string

    @ApiProperty({
        description: "The amount of the transaction.",
        example: 100000,
    })
    readonly amount: number

    @ApiProperty({
        description: "The account number of the transaction.",
        example: "1234567890",
    })
    readonly accountNumber: string

    @ApiProperty({
        description: "The description of the transaction.",
        example: "Payment for order 1234567890",
    })
    readonly description: string

    @ApiProperty({
        description: "The transaction date time of the transaction.",
        example: "2021-01-01T00:00:00Z",
        format: "date-time",
    })
    readonly transactionDateTime: string

    @ApiProperty({
        description: "The virtual account name of the transaction.",
        example: "John Doe",
        nullable: true,
    })
    readonly virtualAccountName: string | null

    @ApiProperty({
        description: "The virtual account number of the transaction.",
        example: "1234567890",
        nullable: true,
    })
    readonly virtualAccountNumber: string | null

    @ApiProperty({
        description: "The counter account bank ID of the transaction.",
        example: "1234567890",
        nullable: true,
    })
    readonly counterAccountBankId: string | null

    @ApiProperty({
        description: "The counter account bank name of the transaction.",
        example: "Bank of America",
        nullable: true,
    })
    readonly counterAccountBankName: string | null

    @ApiProperty({
        description: "The counter account name of the transaction.",
        example: "John Doe",
        nullable: true,
    })
    readonly counterAccountName: string | null

    @ApiProperty({
        description: "The counter account number of the transaction.",
        example: "1234567890",
        nullable: true,
    })
    readonly counterAccountNumber: string | null
}

/**
 * Response from GET payment link.
 */
export class PaymentRequestResponseData {
    @ApiProperty({
        description: "The ID of the payment link.",
        example: "1234567890",
    })
    readonly id: string

    @ApiProperty({
        description: "The order code of the payment link.",
        example: 1234567890,
    })
    readonly orderCode: number

    @ApiProperty({
        description: "The amount of the payment link.",
        example: 100000,
    })
    readonly amount: number

    @ApiProperty({
        description: "The amount paid of the payment link.",
        example: 100000,
    })
    readonly amountPaid: number

    @ApiProperty({
        description: "The amount remaining of the payment link.",
        example: 0,
    })
    readonly amountRemaining: number

    @ApiProperty({
        description: "The status of the payment link.",
        example: "PENDING",
        enum: ["PENDING",
            "PAID",
            "CANCELLED",
            "EXPIRED"],
    })
    readonly status: PaymentLinkStatus

    @ApiProperty({
        description: "The created time of the payment link.",
        example: "2021-01-01T00:00:00Z",
        format: "date-time",
    })
    readonly createdAt: string

    @ApiProperty({
        description: "The transactions of the payment link.",
        type: () => [PaymentRequestTransactionResponseData],
    })
    readonly transactions: Array<PaymentRequestTransactionResponseData>

    @ApiProperty({
        description: "The cancellation reason of the payment link.",
        example: "Payment cancelled",
        nullable: true,
    })
    readonly cancellationReason: string | null

    @ApiProperty({
        description: "The canceled time of the payment link.",
        example: "2021-01-01T00:00:00Z",
        format: "date-time",
        nullable: true,
    })
    readonly canceledAt: string | null
}

/**
 * Response from GET payment request.
 */
export class PaymentRequestResponse extends AbstractRestResponse<PaymentRequestResponseData> {
    @ApiProperty({
        description: "The payment request data.",
        type: PaymentRequestResponseData,
    })
    declare data: PaymentRequestResponseData
}