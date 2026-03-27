import {
    createHmac,
    timingSafeEqual,
} from "node:crypto"

/**
 * Signature for {@link https://payos.vn/docs/api/ | POST /v2/payment-requests}:
 * `amount&cancelUrl&description&orderCode&returnUrl` (alphabetical keys).
 */
export function createPaymentRequestSignature(
    params: {
        amount: number
        cancelUrl: string
        description: string
        orderCode: number
        returnUrl: string
    },
    checksumKey: string,
): string {
    const data =
        `amount=${params.amount}` +
        `&cancelUrl=${params.cancelUrl}` +
        `&description=${params.description}` +
        `&orderCode=${params.orderCode}` +
        `&returnUrl=${params.returnUrl}`
    return createHmac(
        "sha256",
        checksumKey,
    ).update(
        data,
        "utf8",
    ).digest(
        "hex",
    )
}

function sortObjDataByKey(
    object: Record<string, unknown>,
): Record<string, unknown> {
    return Object.keys(object)
        .sort()
        .reduce<Record<string, unknown>>(
            (
                obj, key,
            ) => {
                obj[key] = object[key]
                return obj
            },
            {

            },
        )
}

function convertObjToQueryStr(
    object: Record<string, unknown>,
): string {
    return Object.keys(object)
        .filter(
            (
                key,
            ) => object[key] !== undefined,
        )
        .map(
            (
                key,
            ) => {
                let value: unknown = object[key]
                if (value && Array.isArray(value)) {
                    value = JSON.stringify(
                        (value as unknown[]).map(
                            (
                                val,
                            ) => {
                                if (
                                    val !== null
                                    && typeof val === "object"
                                    && !Array.isArray(val)
                                ) {
                                    return sortObjDataByKey(
                                        val as Record<string, unknown>,
                                    )
                                }
                                return val
                            },
                        ),
                    )
                }
                if (
                    [
                        null,
                        undefined,
                        "undefined",
                        "null",
                    ].includes(
                        value as null | undefined | string,
                    )
                ) {
                    value = ""
                }
                return `${key}=${value}`
            },
        )
        .join(
            "&",
        )
}

/**
 * Verify PayOS webhook `data` against `signature` (HMAC_SHA256, checksum key).
 * Mirrors payOS JavaScript sample for payment link webhooks.
 */
export function verifyPaymentWebhookSignature(
    data: Record<string, unknown>,
    signature: string,
    checksumKey: string,
): boolean {
    const sortedDataByKey = sortObjDataByKey(data)
    const dataQueryStr = convertObjToQueryStr(sortedDataByKey)
    const computed = createHmac(
        "sha256",
        checksumKey,
    ).update(
        dataQueryStr,
        "utf8",
    ).digest(
        "hex",
    )
    const a = Buffer.from(
        computed,
        "utf8",
    )
    const b = Buffer.from(
        signature.toLowerCase(),
        "utf8",
    )
    if (a.length !== b.length) {
        return false
    }
    return timingSafeEqual(
        a,
        b,
    )
}
