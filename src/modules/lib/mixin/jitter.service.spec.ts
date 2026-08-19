import * as fs from "fs"
import * as path from "path"
import {
    JitterService,
} from "./jitter.service"

describe("JitterService",
    () => {
        let service: JitterService

        beforeEach(() => {
            service = new JitterService()
            jest.useFakeTimers()
        })

        afterEach(() => {
            jest.useRealTimers()
            jest.restoreAllMocks()
        })

        describe("delayWithJitter",
            () => {
                it("schedules a wait bounded by [0, baseDelayMs * factor]",
                    () => {
                        // sample the extremes and the middle of Math.random()'s range
                        const randomSpy = jest.spyOn(
                            Math,
                            "random"
                        )
                        const setTimeoutSpy = jest.spyOn(
                            global,
                            "setTimeout"
                        )
                        const baseDelayMs = 1000
                        const factor = 0.5
                        const maxJitterMs = baseDelayMs * factor

                        const samples = [
                            0,
                            0.25,
                            0.5,
                            0.75,
                            0.999999,
                        ]
                        for (const randomValue of samples) {
                            randomSpy.mockReturnValueOnce(randomValue)
                            // not awaited: the Promise executor runs setTimeout
                            // synchronously, so the scheduled delay is already
                            // captured by the spy before this line returns
                            const options = {
                                factor,
                            }
                            void service.delayWithJitter(
                                baseDelayMs,
                                options)
                            const lastCall = setTimeoutSpy.mock.calls.at(-1)
                            const scheduledDelay = lastCall?.[1] as number
                            expect(scheduledDelay).toBeGreaterThanOrEqual(0)
                            expect(scheduledDelay).toBeLessThanOrEqual(maxJitterMs)
                        }
                    })

                it("defaults factor to 1 -- max jitter equals baseDelayMs",
                    () => {
                        const setTimeoutSpy = jest.spyOn(
                            global,
                            "setTimeout"
                        )
                        jest.spyOn(
                            Math,
                            "random"
                        ).mockReturnValue(0.999999)
                        const baseDelayMs = 200

                        void service.delayWithJitter(baseDelayMs)

                        const scheduledDelay = setTimeoutSpy.mock.calls.at(-1)?.[1] as number
                        expect(scheduledDelay).toBeLessThanOrEqual(baseDelayMs)
                    })

                it("varies the scheduled delay across calls",
                    () => {
                        const setTimeoutSpy = jest.spyOn(
                            global,
                            "setTimeout"
                        )
                        const randomSpy = jest.spyOn(
                            Math,
                            "random"
                        )
                        const baseDelayMs = 1000

                        randomSpy.mockReturnValueOnce(0.1)
                        void service.delayWithJitter(baseDelayMs)
                        const first = setTimeoutSpy.mock.calls.at(-1)?.[1]

                        randomSpy.mockReturnValueOnce(0.9)
                        void service.delayWithJitter(baseDelayMs)
                        const second = setTimeoutSpy.mock.calls.at(-1)?.[1]

                        expect(first).not.toBe(second)
                    })

                it("resolves to undefined -- no jitter value ever crosses the public boundary",
                    async () => {
                        const promise = service.delayWithJitter(0)
                        jest.runOnlyPendingTimers()
                        const result = await promise
                        expect(result).toBeUndefined()
                    })
            })

        describe("public surface",
            () => {
                it("exposes delayWithJitter as the only own method on the prototype",
                    () => {
                        // this is the enforced boundary: the jitter computation
                        // (#jitteredDelay) is a real JS private method, invisible
                        // here. If a future change turns it back into a public
                        // `addJitter` method, it starts showing up in this list
                        // and this test goes red.
                        const ownMembers = Object.getOwnPropertyNames(JitterService.prototype)
                        const expectedMembers = [
                            "constructor",
                            "delayWithJitter",
                        ]
                        expect(ownMembers).toEqual(expectedMembers)
                    })

                it("has no publicly reachable jitter-computation method",
                    () => {
                        // even reaching through the instance as an untyped bag of
                        // properties finds nothing -- native `#` private fields
                        // are not just TypeScript-hidden, they are absent from
                        // every enumeration/reflection mechanism at runtime.
                        const looseInstance = service as unknown as Record<string, unknown>
                        expect(looseInstance.addJitter).toBeUndefined()
                        expect(looseInstance.jitteredDelay).toBeUndefined()
                        expect(Object.getOwnPropertyNames(service)).not.toContain("addJitter")
                    })

                it("reads Math.random() exactly once, inside the private method",
                    () => {
                        // Guards the other half of the boundary: a future change
                        // sprinkling a second `Math.random()` call into this file
                        // (e.g. a new public helper) would raise this count and
                        // fail this test.
                        const source = fs.readFileSync(
                            path.join(
                                __dirname,
                                "jitter.service.ts"
                            ),
                            "utf-8"
                        )
                        const matches = source.match(/Math\.random\(\)/g) ?? []
                        expect(matches).toHaveLength(1)
                        expect(source).toContain("#jitteredDelay")
                    })
            })
    })
