/** The `order` namespace of the SePay SDK client, stubbed for tests. */
export interface SepayClientOrderNamespaceMock {
    /** Server-to-server verification call; programmed per-test. */
    retrieve: jest.Mock
}

/** A jest-backed stand-in for the SePay PG SDK client used by the handler. */
export interface SepayClientMock {
    /** Order namespace of the SDK. */
    order: SepayClientOrderNamespaceMock
}

/** The `webhooks` namespace of the payOS SDK client, stubbed for tests. */
export interface PayosClientWebhooksNamespaceMock {
    /** Signature verification call; resolves (valid) or throws (bad sig). */
    verify: jest.Mock
}

/** A jest-backed stand-in for the payOS SDK client used by the handler. */
export interface PayosClientMock {
    /** Webhooks namespace of the SDK. */
    webhooks: PayosClientWebhooksNamespaceMock
}

/** The `webhooks` namespace of the Stripe SDK client, stubbed for tests. */
export interface StripeClientWebhooksNamespaceMock {
    /** Event construction + signature verification; returns or throws. */
    constructEvent: jest.Mock
}

/** A jest-backed stand-in for the Stripe SDK client used by the handler. */
export interface StripeClientMock {
    /** Webhooks namespace of the SDK. */
    webhooks: StripeClientWebhooksNamespaceMock
}
