import RequestQueue from "kafkajs/src/network/requestQueue"
import {
    applyKafkaRequestQueueThrottlePatch,
} from "./request-queue-throttle-patch"

/** KafkaJS's own poll cadence for a backed-up-but-unthrottled queue. */
const CHECK_PENDING_REQUESTS_INTERVAL_MS = 10

/** Silent stand-in for the KafkaJS logger the queue constructor requires. */
const createLoggerStub = (): ConstructorParameters<typeof RequestQueue>[0]["logger"] => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
})

/** A queue in its as-constructed state: never throttled, nothing pending. */
const createQueue = (): RequestQueue => new RequestQueue({
    maxInFlightRequests: null,
    requestTimeout: 30_000,
    enforceRequestTimeout: false,
    clientId: "spec",
    broker: "localhost:9092",
    logger: createLoggerStub(),
})

/** Stand-in for a request parked in `pending` -- the guard only counts them. */
const pendingRequest = (): unknown => ({
})

describe("applyKafkaRequestQueueThrottlePatch",
    () => {
    // the patch mutates a prototype shared with every other spec in the run
        const pristineScheduler = RequestQueue.prototype.scheduleCheckPendingRequests

        beforeEach(() => {
            RequestQueue.prototype.scheduleCheckPendingRequests = pristineScheduler
            jest.useFakeTimers()
        })

        afterEach(() => {
            jest.clearAllTimers()
            // order matters: the setTimeout spy wraps jest's FAKE timer fn, so
            // restoring after useRealTimers would put the fake back on `global`
            // and leave the worker unable to exit
            jest.restoreAllMocks()
            jest.useRealTimers()
        })

        afterAll(() => {
            RequestQueue.prototype.scheduleCheckPendingRequests = pristineScheduler
        })

        describe("the unset-date input the guard exists for",
            () => {
                it("schedules nothing when the queue has never been throttled and nothing is pending",
                    () => {
                        applyKafkaRequestQueueThrottlePatch()
                        const queue = createQueue()

                        // -1 is KafkaJS's "never throttled" sentinel, i.e. the unset date
                        expect(queue.throttledUntil).toBe(-1)

                        queue.scheduleCheckPendingRequests()

                        expect(queue.throttleCheckTimeoutId).toBeNull()
                        expect(jest.getTimerCount()).toBe(0)
                    })

                it("never hands setTimeout a negative delay for the unset sentinel",
                    () => {
                        applyKafkaRequestQueueThrottlePatch()
                        const queue = createQueue()
                        const setTimeoutSpy = jest.spyOn(global,
                            "setTimeout")

                        queue.scheduleCheckPendingRequests()

                        // any call at all would be the clamp coming back; assert the delay
                        // too so a future "schedule at 0" rewrite still trips this
                        expect(setTimeoutSpy).not.toHaveBeenCalled()
                        for (const [, delayMs] of setTimeoutSpy.mock.calls) {
                            expect(delayMs).toBeGreaterThan(0)
                        }
                    })

                it("does not re-arm itself into a 1ms loop when a response is fulfilled",
                    () => {
                        applyKafkaRequestQueueThrottlePatch()
                        const queue = createQueue()

                        // what fulfillRequest() calls after every broker response
                        queue.checkPendingRequests()
                        jest.advanceTimersByTime(1_000)

                        expect(jest.getTimerCount()).toBe(0)
                    })

                it("is exactly what unpatched kafkajs gets wrong",
                    () => {
                        // pins that the guard still covers a live defect: should a kafkajs
                        // upgrade fix this upstream, this fails and the patch can be dropped
                        const queue = createQueue()
                        const setTimeoutSpy = jest.spyOn(global,
                            "setTimeout")

                        queue.scheduleCheckPendingRequests()

                        expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
                        const [, delayMs] = setTimeoutSpy.mock.calls[0]
                        expect(delayMs).toBeLessThan(0)
                    })
            })

        describe("the branches it has to preserve",
            () => {
                it("polls at KafkaJS's cadence when requests are pending but no throttle is open",
                    () => {
                        applyKafkaRequestQueueThrottlePatch()
                        const queue = createQueue()
                        queue.pending.push(pendingRequest())
                        // stubbed: this test is about WHEN the drain is triggered, and the
                        // real drain would try to write the stand-in request to a socket
                        const checkSpy = jest.spyOn(queue,
                            "checkPendingRequests").mockImplementation(() => {
                        })

                        queue.scheduleCheckPendingRequests()
                        jest.advanceTimersByTime(CHECK_PENDING_REQUESTS_INTERVAL_MS - 1)
                        expect(checkSpy).not.toHaveBeenCalled()

                        jest.advanceTimersByTime(1)
                        expect(checkSpy).toHaveBeenCalledTimes(1)
                    })

                it("wakes when the throttle window closes, not before",
                    () => {
                        applyKafkaRequestQueueThrottlePatch()
                        const queue = createQueue()
                        queue.throttledUntil = Date.now() + 500
                        const checkSpy = jest.spyOn(queue,
                            "checkPendingRequests")

                        queue.scheduleCheckPendingRequests()
                        jest.advanceTimersByTime(499)
                        expect(checkSpy).not.toHaveBeenCalled()

                        jest.advanceTimersByTime(1)
                        expect(checkSpy).toHaveBeenCalledTimes(1)
                    })

                it("clears its handle before draining, so the next check can arm",
                    () => {
                        applyKafkaRequestQueueThrottlePatch()
                        const queue = createQueue()
                        queue.pending.push(pendingRequest())

                        queue.scheduleCheckPendingRequests()
                        expect(queue.throttleCheckTimeoutId).not.toBeNull()

                        jest.spyOn(queue,
                            "checkPendingRequests").mockImplementation(() => {
                        })
                        jest.advanceTimersByTime(CHECK_PENDING_REQUESTS_INTERVAL_MS)

                        expect(queue.throttleCheckTimeoutId).toBeNull()
                    })

                it("does not double-arm when a check is already scheduled",
                    () => {
                        applyKafkaRequestQueueThrottlePatch()
                        const queue = createQueue()
                        queue.pending.push(pendingRequest())

                        queue.scheduleCheckPendingRequests()
                        const armed = queue.throttleCheckTimeoutId
                        queue.scheduleCheckPendingRequests()

                        expect(queue.throttleCheckTimeoutId).toBe(armed)
                        expect(jest.getTimerCount()).toBe(1)
                    })
            })

        describe("installation",
            () => {
                it("reports what it did and stays idempotent across module registrations",
                    () => {
                        expect(applyKafkaRequestQueueThrottlePatch()).toBe("applied")

                        const installed = RequestQueue.prototype.scheduleCheckPendingRequests

                        expect(applyKafkaRequestQueueThrottlePatch()).toBe("already-applied")
                        expect(RequestQueue.prototype.scheduleCheckPendingRequests).toBe(installed)
                    })

                it("leaves kafkajs alone when its internals are not what we expect",
                    () => {
                        // simulate an upgrade that moved the method we bolt onto
                        delete (RequestQueue.prototype as Partial<RequestQueue>).scheduleCheckPendingRequests

                        expect(applyKafkaRequestQueueThrottlePatch()).toBe("skipped")
                        expect(RequestQueue.prototype.scheduleCheckPendingRequests).toBeUndefined()
                    })
            })
    })
