import {
    createHmac,
} from "node:crypto"
import {
    Injectable,
} from "@nestjs/common"
import type {
    AxiosInstance,
} from "axios"
import {
    AxiosService,
} from "@modules/integrations/axios/axios.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    getNowpaymentsApiKey,
    getNowpaymentsIpnSecret,
} from "@modules/filesystem/utils/mount-secrets"
import type {
    CreateNowPaymentsInvoiceParams,
    CreateNowPaymentsInvoiceResult,
    NowPaymentsInvoiceStatusResult,
    VerifyNowPaymentsSignatureParams,
} from "./types/nowpayments"

/** NOWPayments `payment_status` values that mean the crypto payment cleared. */
const NOWPAYMENTS_PAID_STATUSES = new Set<string>([
    "finished",
    "confirmed",
])

@Injectable()
/**
 * Thin NOWPayments REST client built on the repo's {@link AxiosService} (no
 * heavy SDK). Creates hosted crypto invoices (USDT/USDC) and verifies IPN
 * callbacks via HMAC-SHA512 of the sorted body with the IPN secret.
 *
 * TODO(real-keys): set `NOWPAYMENTS_API_KEY` / `NOWPAYMENTS_IPN_SECRET` so live
 * invoice creation and IPN verification succeed.
 */
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
     * Poll the payments attached to an invoice to learn whether it was paid,
     * used by transaction reconciliation when no IPN arrived. Calls
     * `GET /v1/payment/?invoiceId={invoiceId}` (authenticated by the API key).
     *
     * @param invoiceId - The NOWPayments invoice id stored at checkout creation
     * @returns Whether any payment is finished/confirmed, plus raw statuses
     */
    async getInvoiceStatus(
        invoiceId: string,
    ): Promise<NowPaymentsInvoiceStatusResult> {
        // read the API key from the mounted secret file (never an env var)
        const apiKey = getNowpaymentsApiKey().trim()
        // list every payment NOWPayments created for this invoice
        const response = await this.http().get(
            "/payment/",
            {
                params: {
                    invoiceId,
                },
                headers: {
                    "x-api-key": apiKey,
                },
            },
        )
        // NOWPayments returns the payments under `data` (array); be defensive about shape
        const payments = Array.isArray(response.data?.data)
            ? (response.data.data as Array<Record<string, unknown>>)
            : []
        // collect each payment's status string for the decision + diagnostics
        const statuses = payments.map((payment) => (
            typeof payment.payment_status === "string" ? payment.payment_status : ""
        ))
        return {
            paid: statuses.some((status) => NOWPAYMENTS_PAID_STATUSES.has(status)),
            empty: statuses.length === 0,
            statuses,
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
                // NOTE: NOWPayments signs the byte/code-unit order that JS's default
                // sort() already produces for these keys, not locale-collated order.
                // The comparator below pins that exact ordering explicitly instead of
                // relying on the implicit default, so this must stay a plain code-unit
                // comparison -- do NOT switch it to localeCompare, which can reorder
                // keys differently in some locales and would silently break IPN
                // signature verification.
                .sort((left, right) => this.compareCodeUnits(left,
                    right))
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
     * Plain code-unit comparison -- NOT `localeCompare`, which can reorder
     * these keys differently in some locales and would silently break IPN
     * signature verification (see {@link sortObjectKeys}).
     */
    private compareCodeUnits(left: string, right: string): number {
        if (left < right) {
            return -1
        }
        if (left > right) {
            return 1
        }
        return 0
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
