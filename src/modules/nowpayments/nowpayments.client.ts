import {
    createHmac,
} from "crypto"
import {
    Injectable,
} from "@nestjs/common"
import type {
    AxiosInstance,
} from "axios"
import {
    AxiosService,
} from "@modules/axios"
import {
    envConfig,
} from "@modules/env"
import {
    getNowpaymentsApiKey,
    getNowpaymentsIpnSecret,
} from "@modules/filesystem"
import type {
    CreateNowPaymentsInvoiceParams,
    CreateNowPaymentsInvoiceResult,
    VerifyNowPaymentsSignatureParams,
} from "./types"

/**
 * Thin NOWPayments REST client built on the repo's {@link AxiosService} (no
 * heavy SDK). Creates hosted crypto invoices (USDT/USDC) and verifies IPN
 * callbacks via HMAC-SHA512 of the sorted body with the IPN secret.
 *
 * TODO(real-keys): set `NOWPAYMENTS_API_KEY` / `NOWPAYMENTS_IPN_SECRET` so live
 * invoice creation and IPN verification succeed.
 */
@Injectable()
export class NowPaymentsClient {
    constructor(
        private readonly axiosService: AxiosService,
    ) {}

    /**
     * Create a hosted invoice and return its id + customer-facing URL.
     *
     * @param params - Amount, reference id, description, redirect URLs
     * @returns The invoice id and hosted invoice URL
     */
    async createInvoice({
        amount,
        referenceId,
        description,
        successUrl,
        cancelUrl,
    }: CreateNowPaymentsInvoiceParams): Promise<CreateNowPaymentsInvoiceResult> {
        // read the currency settings from env (non-secret)
        const {
            priceCurrency,
            payCurrency,
        } = envConfig().services.api.nowpayments
        // read the API key from the mounted secret file (never an env var)
        const apiKey = getNowpaymentsApiKey().trim()
        // create the invoice; order_id carries our reference id back on the IPN
        const response = await this.http().post(
            "/invoice",
            {
                price_amount: amount,
                price_currency: priceCurrency,
                // the crypto asset the customer pays in (e.g. usdttrc20)
                pay_currency: payCurrency,
                order_id: referenceId,
                order_description: description,
                success_url: successUrl,
                cancel_url: cancelUrl,
            },
            {
                headers: {
                    // NOWPayments authenticates via this header, not a bearer token
                    "x-api-key": apiKey,
                    "Content-Type": "application/json",
                },
            },
        )
        return {
            invoiceId: String(response.data.id),
            // hosted page the customer is redirected to in order to pay
            invoiceUrl: String(response.data.invoice_url),
        }
    }

    /**
     * Verify an IPN callback by recomputing the HMAC-SHA512 of the
     * alphabetically-sorted JSON body with the IPN secret and comparing it to
     * the `x-nowpayments-sig` header.
     *
     * @param params - The parsed IPN body + the signature header
     * @returns Whether the recomputed signature matches
     */
    verifySignature({
        body,
        signature,
    }: VerifyNowPaymentsSignatureParams): boolean {
        // read the IPN secret used to sign the callback from the mounted secret file (never an env var)
        const ipnSecret = getNowpaymentsIpnSecret().trim()
        // NOWPayments signs the body serialized with keys sorted alphabetically
        const sortedPayload = JSON.stringify(
            this.sortObjectKeys(body),
        )
        // recompute the HMAC-SHA512 digest over the sorted payload
        const expected = createHmac(
            "sha512",
            ipnSecret,
        )
            .update(sortedPayload)
            .digest("hex")
        // constant-time-ish compare via lowercased hex equality
        return expected === signature.toLowerCase()
    }

    /**
     * Recursively sort object keys so the serialization matches the one
     * NOWPayments signed (their IPN spec sorts keys before hashing).
     *
     * @param value - Any JSON value from the IPN body
     * @returns The value with all nested object keys sorted alphabetically
     */
    private sortObjectKeys(
        value: unknown,
    ): unknown {
        // arrays: sort each element but keep the array order
        if (Array.isArray(value)) {
            return value.map((element) => this.sortObjectKeys(element))
        }
        // plain objects: rebuild with keys in alphabetical order
        if (value !== null && typeof value === "object") {
            const source = value as Record<string, unknown>
            return Object.keys(source)
                .sort()
                .reduce<Record<string, unknown>>(
                    (acc, key) => {
                        // recurse so nested objects/arrays are also sorted
                        acc[key] = this.sortObjectKeys(source[key])
                        return acc
                    },
                    {
                    },
                )
        }
        // primitives: returned unchanged
        return value
    }

    /**
     * Lazily create (and cache) the axios instance pinned to the base URL.
     *
     * @returns The shared NOWPayments axios instance
     */
    private http(): AxiosInstance {
        // base URL is sandbox by default; ops switch to live via NOWPAYMENTS_BASE_URL
        const {
            baseUrl,
        } = envConfig().services.api.nowpayments
        // AxiosService caches by key so this returns the same instance each call
        return this.axiosService.create({
            key: "nowpayments",
            config: {
                baseURL: baseUrl,
            },
        })
    }
}
