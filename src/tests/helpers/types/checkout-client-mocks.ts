import type {
    SepayClientOrderNamespaceMock,
} from "./webhook-client-mocks"

/** The `paymentRequests` namespace of the payOS SDK client, stubbed for tests. */
export interface PayosCheckoutRequestsNamespaceMock {
    /** Checkout-link creation call; programmed per-test. */
    create: jest.Mock
}

/** A jest-backed stand-in for the payOS SDK client used by the checkout-initiation gateway. */
export interface PayosCheckoutClientMock {
    /** Payment-requests namespace of the SDK. */
    paymentRequests: PayosCheckoutRequestsNamespaceMock
}

/** The `checkout` namespace of the SePay SDK client, stubbed for tests. */
export interface SepayCheckoutNamespaceMock {
    /** Hosted checkout-URL creation call; programmed per-test. */
    initCheckoutUrl: jest.Mock
    /** One-time-payment field builder call; programmed per-test. */
    initOneTimePaymentFields: jest.Mock
}

/** A jest-backed stand-in for the SePay SDK client used by the checkout-initiation gateway. */
export interface SepayCheckoutClientMock {
    /** Checkout namespace of the SDK. */
    checkout: SepayCheckoutNamespaceMock
}

/**
 * A jest-backed stand-in for the SePay SDK client used where a spec drives both checkout
 * initiation and the reconcile poll's `order.retrieve` verification.
 */
export interface SepayCheckoutAndOrderClientMock {
    /** Checkout namespace of the SDK. */
    checkout: SepayCheckoutNamespaceMock
    /** Order namespace of the SDK. */
    order: SepayClientOrderNamespaceMock
}

/** The `sessions` namespace of the Stripe SDK checkout client, stubbed for tests. */
export interface StripeCheckoutSessionsNamespaceMock {
    /** Checkout-session creation call; programmed per-test. */
    create: jest.Mock
}

/** The `checkout` namespace of the Stripe SDK client, stubbed for tests. */
export interface StripeCheckoutNamespaceMock {
    /** Sessions namespace of the SDK. */
    sessions: StripeCheckoutSessionsNamespaceMock
}

/** A jest-backed stand-in for the Stripe SDK client used by the checkout-initiation gateway. */
export interface StripeCheckoutClientMock {
    /** Checkout namespace of the SDK. */
    checkout: StripeCheckoutNamespaceMock
}

/** A jest-backed stand-in for the PayPal SDK client used by the checkout-initiation gateway. */
export interface PaypalCheckoutClientMock {
    /** Order creation call; programmed per-test. */
    createOrder: jest.Mock
}

/** A jest-backed stand-in for the NOWPayments SDK client used by the checkout-initiation gateway. */
export interface NowPaymentsCheckoutClientMock {
    /** Invoice creation call; programmed per-test. */
    createInvoice: jest.Mock
}
