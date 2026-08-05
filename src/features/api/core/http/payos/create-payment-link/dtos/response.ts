import {
    AbstractRestResponse,
} from "@modules/api"
import {
    ApiProperty 
} from "@nestjs/swagger"
import type {
    PaymentLinkStatus 
} from "@payos/node"

/**
 * Response from POST create payment link.
 */
export class CreatePaymentLinkResponseData {
    @ApiProperty(
        {
            description: "The BIN of the payment link.",
            example: "1234567890",
        },
    )
        bin: string
    @ApiProperty(
        {
            description: "The account number of the payment link.",
            example: "1234567890",
        },
    )
        accountNumber: string
    @ApiProperty(
        {
            description: "The account name of the payment link.",
            example: "John Doe",
        },
    )
        accountName: string
    @ApiProperty(
        {
            description: "The amount of the payment link.",
            example: 100000,
        },
    )
        amount: number
    @ApiProperty(
        {
            description: "The description of the payment link.",
            example: "Payment for order 1234567890",
        },
    )
        description: string
    @ApiProperty(
        {
            description: "The order code of the payment link.",
            example: 1234567890,
        },
    )
        orderCode: number
    @ApiProperty(
        {
            description: "The currency of the payment link.",
            example: "VND",
        },
    )
        currency: string
    @ApiProperty(
        {
            description: "The payment link ID of the payment link.",
            example: "1234567890",
        },
    )
        paymentLinkId: string
    @ApiProperty(
        {
            description: "The status of the payment link.",
            example: "PENDING",
        },
    )
        status: PaymentLinkStatus
    @ApiProperty(
        {
            description: "The expired at of the payment link.",
            example: 1716806400,
        },
    )
        expiredAt?: number
    @ApiProperty(
        {
            description: "The checkout URL of the payment link.",
            example: "https://checkout.payos.vn/1234567890",
        },
    )
        checkoutUrl: string
    @ApiProperty(
        {
            description: "The QR code of the payment link.",
            example: "https://qrcode.payos.vn/1234567890",
        },
    )
        qrCode: string
};

/**
 * House REST envelope around PayOS checkout fields so the SPA reads `data` the same way as
 * every other HTTP success.
 */
export class CreatePaymentLinkResponse extends AbstractRestResponse<CreatePaymentLinkResponseData> {
    @ApiProperty(
        {
            description: "The payment link data.",
            type: CreatePaymentLinkResponseData,
        },
    )
    declare data: CreatePaymentLinkResponseData
}