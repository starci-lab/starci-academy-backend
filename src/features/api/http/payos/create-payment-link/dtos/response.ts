/**
 * payOS merchant API response envelope (`/v2/payment-requests`, etc.).
 */
export interface PayosMerchantApiResponse<T = unknown> {
    code: string
    desc: string
    data?: T
    signature?: string
}

/**
 * Response from POST create payment link.
 */
export type CreatePaymentLinkResponse = PayosMerchantApiResponse
