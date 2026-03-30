/**
 * Builds a numeric order code for PayOS `paymentRequests.create` (unique enough for typical throughput).
 *
 * @returns Integer order code safe for PayOS API.
 */
export function generatePayOsOrderCode(): number {
    return Date.now() * 1000 + Math.floor(
        Math.random() * 1000,
    )
}
