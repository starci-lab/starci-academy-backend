import type {
    INestApplication,
} from "@nestjs/common"
import type {
    SepayClientMock,
    PayosClientMock,
    StripeClientMock,
} from "./webhook-client-mocks"

/** A jest-backed stand-in for the enroll-job enqueue service used by the grant path. */
export interface EnqueueEnrollJobMock {
    /** Mocked enqueue used by the course-enrollment branch. */
    enqueue: jest.Mock
}

/** The booted e2e application plus the handles a spec needs to drive it. */
export interface E2eApp {
    /** The initialised Nest application (real HTTP server + real Postgres). */
    app: INestApplication
    /** The SePay client mock so a spec can program/assert `order.retrieve`. */
    sepayClient: SepayClientMock
    /** The payOS client mock so a spec can program/assert `webhooks.verify`. */
    payosClient: PayosClientMock
    /** The Stripe client mock so a spec can program `webhooks.constructEvent`. */
    stripeClient: StripeClientMock
    /** The enroll-enqueue mock so a spec can assert the worker hand-off. */
    enqueueEnrollJob: EnqueueEnrollJobMock
}
