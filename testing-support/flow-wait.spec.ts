import {
    expectNoMessage,
    nextMessage,
    until,
} from "../src/tests/helpers/flow-wait"
import type {
    MessageSource,
} from "../src/tests/helpers/flow-wait"

/**
 * A tiny event source, so these specs test the waiting logic rather than a socket library.
 *
 * It records whether listeners were detached, because a wait that leaks a listener turns the NEXT
 * step's assertion into a race -- and that is the kind of bug a flow suite blames on "flakiness".
 */
const makeSource = () => {
    const listeners = new Map<string, Set<(payload: unknown) => void>>()
    const source: MessageSource = {
        on: (event, listener) => {
            const set = listeners.get(event) ?? new Set()
            set.add(listener)
            listeners.set(event,
                set)
            return source
        },
        off: (event, listener) => {
            listeners.get(event)?.delete(listener)
            return source
        },
    }
    return {
        source,
        emit: (event: string, payload: unknown) => {
            for (const listener of [...(listeners.get(event) ?? [])]) {
                listener(payload)
            }
        },
        listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
    }
}

describe("until",
    () => {
        it("returns as soon as the predicate holds, without waiting out the deadline",
            async () => {
                let settled = false
                setTimeout(() => {
                    settled = true
                },
                60)

                const startedAt = Date.now()
                await until(() => settled,
                    {
                        timeout: 2_000,
                        interval: 10,
                    })

                // the point of polling: it costs what the system costs, not what the guess costs
                expect(Date.now() - startedAt).toBeLessThan(1_000)
            })

        it("treats a throwing predicate as `not yet` rather than as a failure",
            async () => {
                let attempts = 0
                await until(() => {
                    attempts += 1
                    // a row that has not been written yet makes findOneOrFail throw
                    if (attempts < 3) {
                        throw new Error("row not found")
                    }
                    return true
                },
                {
                    timeout: 2_000,
                    interval: 5,
                })

                expect(attempts).toBe(3)
            })

        it("fails at the deadline and names what it was waiting for",
            async () => {
                await expect(
                    until(() => false,
                        {
                            timeout: 80,
                            interval: 10,
                            describe: "the enrollment to open",
                        }),
                ).rejects.toThrow(/waiting for the enrollment to open/)
            })

        it("carries the last error into the timeout message, so the cause is not lost",
            async () => {
                await expect(
                    until(() => {
                        throw new Error("relation does not exist")
                    },
                    {
                        timeout: 60,
                        interval: 10,
                    }),
                ).rejects.toThrow(/relation does not exist/)
            })
    })

describe("nextMessage",
    () => {
        it("resolves with the matching payload and detaches its listener",
            async () => {
                const { source, emit, listenerCount } = makeSource()
                const awaited = nextMessage<{ type: string }>(
                    source,
                    "notification",
                    (payload) => payload.type === "ENROLLMENT_OPENED",
                    {
                        timeout: 2_000,
                    },
                )

                emit("notification",
                    {
                        type: "SOMETHING_ELSE",
                    })
                emit("notification",
                    {
                        type: "ENROLLMENT_OPENED",
                        courseId: "course-1",
                    })

                await expect(awaited).resolves.toMatchObject({
                    type: "ENROLLMENT_OPENED",
                    courseId: "course-1",
                })
                expect(listenerCount("notification")).toBe(0)
            })

        it("fails at the deadline and detaches, so the next step is not raced",
            async () => {
                const { source, listenerCount } = makeSource()

                await expect(
                    nextMessage(source,
                        "notification",
                        () => true,
                        {
                            timeout: 60,
                            describe: "a delivery",
                        }),
                ).rejects.toThrow(/waiting for a delivery/)
                expect(listenerCount("notification")).toBe(0)
            })
    })

describe("expectNoMessage",
    () => {
        it("passes when nothing matching arrives",
            async () => {
                const { source, emit, listenerCount } = makeSource()
                setTimeout(() => emit("notification",
                    {
                        type: "FOR_SOMEBODY_ELSE",
                    }),
                20)

                await expectNoMessage<{ type: string }>(
                    source,
                    "notification",
                    (payload) => payload.type === "ENROLLMENT_OPENED",
                    {
                        within: 60,
                    },
                )
                expect(listenerCount("notification")).toBe(0)
            })

        it("fails when a matching message arrives, and shows what it was",
            async () => {
                const { source, emit } = makeSource()
                setTimeout(() => emit("notification",
                    {
                        type: "ENROLLMENT_OPENED",
                    }),
                10)

                await expect(
                    expectNoMessage(source,
                        "notification",
                        () => true,
                        {
                            within: 60,
                        }),
                ).rejects.toThrow(/but one arrived: \{"type":"ENROLLMENT_OPENED"\}/)
            })
    })
