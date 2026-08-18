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
    getPaypalClientId,
    getPaypalClientSecret,
    getPaypalWebhookId,
} from "@modules/filesystem/utils/mount-secrets"
import type {
    CapturePaypalOrderParams,
    CapturePaypalOrderResult,
    CreatePaypalOrderParams,
    CreatePaypalOrderResult,
    PaypalAxiosErrorLike,
    PaypalLink,
    PaypalOrderDetail,
    PaypalPurchaseUnit,
    RetrievePaypalOrderParams,
    VerifyPaypalWebhookParams,
} from "./types/paypal"

@Injectable()
/**
 * Thin PayPal Orders v2 REST client built on the repo's {@link AxiosService}
 * (no heavy SDK). Handles OAuth2 client-credentials auth, order creation,
 * order lookup, and webhook-signature verification.
 *
 * TODO(real-keys): set `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` /
 * `PAYPAL_WEBHOOK_ID` so live calls authenticate and verify.
 */
export class PaypalClient {
    constructor(
        private readonly axiosService: AxiosService,
    ) {}

    /**
     * Create a PayPal order and return its id + buyer approval URL.
     *
     * @param params - Amount, reference id, description, redirect URLs
     * @returns The PayPal order id and approval URL
     */
    async createOrder({
        amount,
        referenceId,
        description,
        returnUrl,
        cancelUrl,
    }: CreatePaypalOrderParams): Promise<CreatePaypalOrderResult> {
        // pull the configured currency (uppercase per PayPal API)
        const {
            currency,
        } = envConfig().services.api.paypal
        // obtain a fresh bearer token (client-credentials grant)
        const accessToken = await this.getAccessToken()
        // create the order; capture intent so the funds are taken on approval
        const response = await this.http().post(
            "/v2/checkout/orders",
            {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        // echo our reference id back on every webhook/order detail
                        custom_id: referenceId,
                        description,
                        amount: {
                            currency_code: currency,
                            // PayPal requires the value as a 2-decimal string
                            value: amount.toFixed(2),
                        },
                    },
                ],
                application_context: {
                    return_url: returnUrl,
                    cancel_url: cancelUrl,
                    // skip the shipping-address step for a digital purchase
                    shipping_preference: "NO_SHIPPING",
                    // land the buyer straight on the pay button
                    user_action: "PAY_NOW",
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            },
        )
        // pick the HATEOAS link the buyer must visit to approve the order
        const links = (response.data.links ?? []) as Array<PaypalLink>
        const approveLink = links.find((link) => link.rel === "approve")
        return {
            orderId: String(response.data.id),
            // fall back to empty string when PayPal omits the link (never expected)
            approveUrl: approveLink?.href ?? "",
        }
    }

    /**
     * Look up an order's authoritative status + reference id.
     *
     * @param params - The PayPal order id
     * @returns The order id, status, and echoed reference id
     */
    async retrieveOrder({
        orderId,
    }: RetrievePaypalOrderParams): Promise<PaypalOrderDetail> {
        // authenticate the lookup with a bearer token
        const accessToken = await this.getAccessToken()
        // GET the order detail; a non-2xx throws (rejects the webhook upstream)
        const response = await this.http().get(
            `/v2/checkout/orders/${orderId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        )
        // recover our reference id from the first purchase unit's custom_id
        const purchaseUnits = (response.data.purchase_units ?? []) as Array<PaypalPurchaseUnit>
        return {
            id: String(response.data.id),
            status: String(response.data.status),
            referenceId: purchaseUnits[0]?.custom_id,
        }
    }

    /**
     * Capture the funds of an APPROVED order. With `intent: CAPTURE`, buyer
     * approval alone does NOT move money -- the funds are only taken when this
     * capture call runs. Treats an already-captured order (PayPal 422
     * `ORDER_ALREADY_CAPTURED`) as a success so retries/webhook+reconcile races
     * are idempotent.
     *
     * @param params - The PayPal order id to capture
     * @returns The order id, post-capture status, reference id, and a `captured` flag
     */
    async captureOrder({
        orderId,
    }: CapturePaypalOrderParams): Promise<CapturePaypalOrderResult> {
        // authenticate the capture with a bearer token
        const accessToken = await this.getAccessToken()
        try {
            // POST capture; PayPal moves the funds and returns the COMPLETED order
            const response = await this.http().post(
                `/v2/checkout/orders/${orderId}/capture`,
                {
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                },
            )
            const status = String(response.data.status)
            const purchaseUnits = (response.data.purchase_units ?? []) as Array<PaypalPurchaseUnit>
            return {
                id: String(response.data.id),
                status,
                referenceId: purchaseUnits[0]?.custom_id,
                captured: status === "COMPLETED",
            }
        } catch (error) {
            // an already-captured order is not a failure -- the money is in
            const issue = this.extractPaypalIssue(error)
            if (issue === "ORDER_ALREADY_CAPTURED") {
                // recover the authoritative status + reference id via the detail API
                const detail = await this.retrieveOrder({
                    orderId,
                })
                return {
                    id: detail.id,
                    status: detail.status,
                    referenceId: detail.referenceId,
                    captured: true,
                }
            }
            // any other failure is a real capture failure -> propagate
            throw error
        }
    }

    /**
     * Pull the first PayPal error `issue` code out of an axios error body
     * (`details[0].issue`), or undefined when the shape does not match.
     *
     * @param error - The thrown axios error
     * @returns The PayPal issue code, if present
     */
    private extractPaypalIssue(
        error: unknown,
    ): string | undefined {
        const data = (error as PaypalAxiosErrorLike)?.response?.data
        return data?.details?.[0]?.issue
    }

    /**
     * Verify a webhook event's signature via PayPal's verify-webhook-signature
     * API. Returns true only when PayPal reports `SUCCESS`.
     *
     * @param params - The PayPal signature headers + parsed event body
     * @returns Whether the signature is valid
     */
    async verifyWebhookSignature({
        authAlgo,
        certUrl,
        transmissionId,
        transmissionSig,
        transmissionTime,
        webhookEvent,
    }: VerifyPaypalWebhookParams): Promise<boolean> {
        // the configured webhook id must match the one PayPal signed against;
        // read from the mounted secret file (never an env var)
        const webhookId = getPaypalWebhookId().trim()
        // authenticate the verification call with a bearer token
        const accessToken = await this.getAccessToken()
        // ask PayPal to verify the transmission against the stored webhook id
        const response = await this.http().post(
            "/v1/notifications/verify-webhook-signature",
            {
                auth_algo: authAlgo,
                cert_url: certUrl,
                transmission_id: transmissionId,
                transmission_sig: transmissionSig,
                transmission_time: transmissionTime,
                webhook_id: webhookId,
                webhook_event: webhookEvent,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            },
        )
        // PayPal returns `verification_status: "SUCCESS"` on a valid signature
        return response.data.verification_status === "SUCCESS"
    }

    /**
     * Fetch an OAuth2 bearer token via the client-credentials grant.
     *
     * @returns A short-lived PayPal access token
     */
    private async getAccessToken(): Promise<string> {
        // read the REST app credentials from the mounted secret files (never env vars)
        const clientId = getPaypalClientId().trim()
        const clientSecret = getPaypalClientSecret().trim()
        // request a token; Basic auth = clientId:clientSecret, body = grant type
        const response = await this.http().post(
            "/v1/oauth2/token",
            "grant_type=client_credentials",
            {
                // axios `auth` builds the Basic header from the credentials
                auth: {
                    username: clientId,
                    password: clientSecret,
                },
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        )
        // return the bearer token for the caller to attach to the next request
        return String(response.data.access_token)
    }

    /**
     * Lazily create (and cache) the axios instance pinned to the PayPal base URL.
     *
     * @returns The shared PayPal axios instance
     */
    private http(): AxiosInstance {
        // base URL is sandbox by default; ops switch to live via PAYPAL_BASE_URL
        const {
            baseUrl,
        } = envConfig().services.api.paypal
        // AxiosService caches by key so this returns the same instance each call
        return this.axiosService.create({
            key: "paypal",
            config: {
                baseURL: baseUrl,
            },
        })
    }
}
