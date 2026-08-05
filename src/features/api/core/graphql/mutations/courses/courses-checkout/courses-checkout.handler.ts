import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
    PaymentType,
    TransactionEntity,
    TransactionItemEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    CoursesCheckoutEmptyException,
    InstallmentCurrencyNotSupportedException,
    MissingUsdPriceException,
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError,
    UnsupportedPaymentTypeException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    EnqueueReconcileTransactionJobService,
    InstallmentPlanService,
    PAYMENT_MODIFIER_CAPABILITY,
} from "@modules/bussiness"
import {
    RetryService,
} from "@modules/mixin"
import {
    envConfig,
} from "@modules/env"
import {
    InjectPayOS,
} from "@modules/payos"
import {
    PayOS,
} from "@payos/node"
import {
    InjectSepay,
} from "@modules/sepay"
import {
    SePayPgClient,
} from "sepay-pg-node"
import {
    InjectStripe,
} from "@modules/stripe"
import Stripe from "stripe"
import {
    PaypalClient,
} from "@modules/paypal"
import {
    NowPaymentsClient,
} from "@modules/nowpayments"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    CoursesCheckoutPricingService,
} from "./courses-checkout-pricing.service"
import {
    CoursesCheckoutCommand,
} from "./courses-checkout.command"
import {
    CoursesCheckoutResponseData,
} from "./graphql-types"
import type {
    BuildSepayCoursesCheckoutParams,
    ResolveCoursesCheckoutParams,
    ResolveCoursesCheckoutResult,
} from "./types"

/** Label used in provider descriptions and missing-USD-price metadata. */
const COURSES_CHECKOUT_LABEL = "courses-checkout"

@CommandHandler(CoursesCheckoutCommand)
@Injectable()
/**
 * Prices the cart into one gateway payment and a pending order so webhook
 * fan-out can enroll each line without the client calling enroll N times.
 */
export class CoursesCheckoutHandler
    extends ICQRSHandler<CoursesCheckoutCommand, CoursesCheckoutResponseData>
    implements ICommandHandler<CoursesCheckoutCommand, CoursesCheckoutResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectPayOS()
        private readonly payos: PayOS,
        @InjectSepay()
        private readonly sepay: SePayPgClient,
        @InjectStripe()
        private readonly stripe: Stripe,
        private readonly paypalClient: PaypalClient,
        private readonly nowPaymentsClient: NowPaymentsClient,
        private readonly coursesCheckoutPricingService: CoursesCheckoutPricingService,
        private readonly retryService: RetryService,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
        private readonly installmentPlanService: InstallmentPlanService,
    ) {
        super()
    }

    /**
     * Price every requested course, sum the totals, create ONE gateway payment,
     * and persist a pending order (`transactions` row + one `transaction_items`
     * row per course). On payment success the webhook / reconcile fan-out enqueues
     * one enroll job per line.
     *
     * @param command - The checkout command (request + auth context).
     * @returns The checkout payload for the client.
     */
    protected override async process(
        command: CoursesCheckoutCommand,
    ): Promise<CoursesCheckoutResponseData> {
        const {
            request: {
                courseIds,
                paymentType,
                returnUrl,
                cancelUrl,
                installmentMonths,
            },
            user,
        } = command.params

        // an authenticated user is required to own the order + enrollments
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // installments are VND-only -- read from the SSOT capability
        // matrix (see PAYMENT_MODIFIER_CAPABILITY) rather than hand-rolling the
        // currency check; the non-domestic gateways can't collect the later
        // cycles, so refuse before creating anything
        if (installmentMonths && !PAYMENT_MODIFIER_CAPABILITY[paymentType]?.supportsInstallment) {
            throw new InstallmentCurrencyNotSupportedException({
                paymentType: String(paymentType),
            })
        }

        // price the cart via the SHARED pricing service (same code the checkout-
        // preview query uses, so the charged price always equals the shown price):
        // de-dupes ids, drops already-owned courses, applies progressive loyalty +
        // the order bundle bonus, and sums the VND/USD order totals.
        const priced = await this.coursesCheckoutPricingService.priceCart({
            userId: user.id,
            courseIds,
        })
        // nothing purchasable (empty request, or every course already owned) -> refuse
        // to open a zero-total checkout; the client should refresh the cart
        if (priced.lines.length === 0) {
            throw new CoursesCheckoutEmptyException({
                userId: user.id,
            })
        }

        // installment : the plan owes the WHOLE cart total x (1+markup); the
        // gateway collects only the FIRST cycle now (monthly), the intent is snapshotted
        // onto the order transaction so the enroll fan-out creates the Fixed plan once
        // on payment success (§2.2/§2.3). One-shot order charges the full VND total.
        const installment = installmentMonths
            ? this.installmentPlanService.computeInstallmentTotal(priced.totalChargedVnd,
                installmentMonths)
            : null
        const chargedVnd = installment ? installment.monthlyAmountVnd : priced.totalChargedVnd

        // one order code identifies the whole order across the gateway + webhook
        const orderCode = this.generateOrderCode()
        // create the single gateway checkout for the charged amount (monthly cycle
        // for installments, else the summed total)
        const checkout = await this.resolveCheckout({
            paymentType,
            amount: chargedVnd,
            priceUsd: priced.totalChargedUsd,
            orderCode,
            itemCount: priced.itemCount,
            returnUrl,
            cancelUrl,
        })

        // persist the ORDER (transaction). `course` is null -- the per-course rows
        // live in `transaction_items`. pricingPhase is the first line's phase as a
        // record only; the enroll step re-reads each course's phase at grant time.
        const transaction = this.entityManager.create(
            TransactionEntity,
            {
                user,
                course: null,
                referenceId: String(orderCode),
                amount: checkout.amount,
                // discount is tracked per line; the order-level column stays 0
                discountPercent: 0,
                pricingPhase: priced.lines[0].pricingPhase,
                paymentType,
                checkoutUrl: checkout.checkoutUrl,
                // native gateway id for reconciliation polling (null for PayOS/Sepay)
                providerPaymentId: checkout.providerPaymentId ?? null,
                status: TransactionStatus.Pending,
                actionType: ActionType.Enroll,
                aiSubTier: null,
                installmentMonths: installment ? installment.months : null,
                installmentMarkupPercent: installment ? installment.markupPercent : null,
                installmentTotalVnd: installment ? installment.totalAmountVnd : null,
            },
        )
        await this.entityManager.save(transaction)

        // persist one line per course with its own charged breakdown -- the payment
        // success fan-out reads these rows to enqueue one enroll job per course
        const transactionItems = priced.lines.map(
            (line) => this.entityManager.create(
                TransactionItemEntity,
                {
                    transaction,
                    course: line.course,
                    amount: line.chargedVnd,
                    discountPercent: line.discountPercent,
                    pricingPhase: line.pricingPhase,
                },
            ),
        )
        await this.entityManager.save(transactionItems)

        // schedule the delayed reconcile poll (fires if no webhook arrives)
        await this.enqueueReconcileTransactionJobService.enqueue({
            transactionId: transaction.id,
        })

        // return the redirect info + how many courses the order will enroll
        return {
            checkoutUrl: checkout.checkoutUrl,
            referenceId: String(orderCode),
            transactionId: transaction.id,
            amount: checkout.amount,
            itemCount: priced.itemCount,
            checkoutFields: checkout.checkoutFields,
        }
    }

    /**
     * Create a checkout link for the chosen provider using the summed order totals.
     * Mirrors the single-course + membership resolvers: domestic gateways charge
     * the VND total; international gateways charge the USD total (rejected when any
     * line lacks a USD price).
     *
     * @param params - Payment type, summed totals, order code, and redirect URLs.
     * @returns The gateway checkout URL, charged VND amount, and native payment id.
     * @throws PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError when redirect URLs are missing.
     * @throws MissingUsdPriceException when an international gateway has no USD total.
     */
    private async resolveCheckout({
        paymentType,
        amount,
        priceUsd,
        orderCode,
        itemCount,
        returnUrl,
        cancelUrl,
    }: ResolveCoursesCheckoutParams): Promise<ResolveCoursesCheckoutResult> {
        switch (paymentType) {
        case PaymentType.PayOS: {
            // PayOS needs explicit redirect URLs
            if (!returnUrl || !cancelUrl) {
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError({
                    hasPayOsReturnUrl: Boolean(returnUrl),
                    hasPayOsCancelUrl: Boolean(cancelUrl),
                })
            }
            // create the PayOS payment link for the VND total (retried on 5xx/network)
            const paymentLink = await this.retryService.retry({
                action: async () => this.payos.paymentRequests.create({
                    amount,
                    cancelUrl,
                    description: "EN",
                    orderCode,
                    returnUrl,
                }),
            })
            return {
                checkoutUrl: paymentLink.checkoutUrl,
                amount: paymentLink.amount,
            }
        }
        case PaymentType.Sepay: {
            // SePay PG: sign the order fields; client POSTs them to the checkout URL
            return this.buildSepayCheckout({
                orderCode,
                amount,
                itemCount,
                successUrl: returnUrl,
                cancelUrl,
            })
        }
        case PaymentType.Stripe: {
            // Stripe (redirect): needs explicit success/cancel URLs
            if (!returnUrl || !cancelUrl) {
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError({
                    hasPayOsReturnUrl: Boolean(returnUrl),
                    hasPayOsCancelUrl: Boolean(cancelUrl),
                })
            }
            // never charge VND as USD -- reject when any line lacked a USD price
            if (!priceUsd || priceUsd <= 0) {
                throw new MissingUsdPriceException({
                    paymentType: PaymentType.Stripe,
                    tier: COURSES_CHECKOUT_LABEL,
                })
            }
            // configured currency Stripe charges in (e.g. usd)
            const {
                currency,
            } = envConfig().services.api.stripe
            // one line item for the whole order (summed USD total -> cents)
            const session = await this.retryService.retry({
                action: async () => this.stripe.checkout.sessions.create({
                    mode: "payment",
                    // echo our reference id so the webhook can match the transaction
                    client_reference_id: String(orderCode),
                    success_url: returnUrl,
                    cancel_url: cancelUrl,
                    line_items: [
                        {
                            quantity: 1,
                            price_data: {
                                currency,
                                // Stripe expects cents -> USD dollars x 100
                                unit_amount: Math.round(priceUsd * 100),
                                product_data: {
                                    name: `${itemCount} courses (${orderCode})`,
                                },
                            },
                        },
                    ],
                }),
            })
            return {
                checkoutUrl: session.url ?? "",
                // amount stays the VND reference on the transaction
                amount,
                // store the session id so reconciliation can poll Stripe by id
                providerPaymentId: session.id,
            }
        }
        case PaymentType.Paypal: {
            // PayPal (redirect): needs explicit return/cancel URLs
            if (!returnUrl || !cancelUrl) {
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError({
                    hasPayOsReturnUrl: Boolean(returnUrl),
                    hasPayOsCancelUrl: Boolean(cancelUrl),
                })
            }
            // never charge VND as USD -- reject when any line lacked a USD price
            if (!priceUsd || priceUsd <= 0) {
                throw new MissingUsdPriceException({
                    paymentType: PaymentType.Paypal,
                    tier: COURSES_CHECKOUT_LABEL,
                })
            }
            // create the PayPal order for the summed USD total
            const order = await this.retryService.retry({
                action: async () => this.paypalClient.createOrder({
                    // PayPal charges USD dollars (client formats to a 2-decimal string)
                    amount: priceUsd,
                    referenceId: String(orderCode),
                    description: `${itemCount} courses (${orderCode})`,
                    returnUrl,
                    cancelUrl,
                }),
            })
            return {
                checkoutUrl: order.approveUrl,
                amount,
                // store the PayPal order id so reconciliation can poll by id
                providerPaymentId: order.orderId,
            }
        }
        case PaymentType.Crypto: {
            // NOWPayments (redirect): needs explicit success/cancel URLs
            if (!returnUrl || !cancelUrl) {
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError({
                    hasPayOsReturnUrl: Boolean(returnUrl),
                    hasPayOsCancelUrl: Boolean(cancelUrl),
                })
            }
            // never charge VND as USD -- reject when any line lacked a USD price
            if (!priceUsd || priceUsd <= 0) {
                throw new MissingUsdPriceException({
                    paymentType: PaymentType.Crypto,
                    tier: COURSES_CHECKOUT_LABEL,
                })
            }
            // create the hosted crypto invoice for the summed USD total
            const invoice = await this.retryService.retry({
                action: async () => this.nowPaymentsClient.createInvoice({
                    // NOWPayments charges USD dollars as price_amount in the price currency
                    amount: priceUsd,
                    referenceId: String(orderCode),
                    description: `${itemCount} courses (${orderCode})`,
                    successUrl: returnUrl,
                    cancelUrl,
                }),
            })
            return {
                checkoutUrl: invoice.invoiceUrl,
                amount,
                // store the NOWPayments invoice id so reconciliation can poll by id
                providerPaymentId: invoice.invoiceId,
            }
        }
        default:
            throw new UnsupportedPaymentTypeException({
                paymentType: String(paymentType),
            })
        }
    }

    /**
     * Build a SePay PG one-time-payment checkout: sign the order fields and return
     * the form action URL + JSON-encoded signed fields. Pure (local HMAC signing).
     *
     * @param params - Order code, VND total, course count, and redirect URLs.
     * @returns The SePay form action URL + signed fields + VND amount.
     */
    private buildSepayCheckout({
        orderCode,
        amount,
        itemCount,
        successUrl,
        cancelUrl,
    }: BuildSepayCoursesCheckoutParams): ResolveCoursesCheckoutResult {
        // sign the one-time-payment fields for the summed VND total
        const fields = this.sepay.checkout.initOneTimePaymentFields({
            operation: "PURCHASE",
            order_invoice_number: String(orderCode),
            order_amount: amount,
            currency: "VND",
            order_description: `${itemCount} courses ${orderCode}`,
            success_url: successUrl,
            cancel_url: cancelUrl,
            error_url: cancelUrl,
        })
        return {
            checkoutUrl: this.sepay.checkout.initCheckoutUrl(),
            amount,
            checkoutFields: JSON.stringify(fields),
        }
    }

    /**
     * Generate a provider order code (also stored as the transaction reference).
     *
     * @returns A unique-per-request integer order code.
     */
    private generateOrderCode(): number {
        // millisecond timestamp + random suffix keeps codes unique per request
        return Date.now() * 1000 + Math.floor(
            Math.random() * 1000,
        )
    }
}
