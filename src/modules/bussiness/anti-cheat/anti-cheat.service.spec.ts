import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AntiCheatService,
} from "./anti-cheat.service"

describe("AntiCheatService",
    () => {
        let module: TestingModule
        let service: AntiCheatService

        beforeEach(async () => {
            module = await Test.createTestingModule({
                providers: [
                    // pure, stateless heuristic — no deps to mock
                    AntiCheatService,
                ],
            }).compile()

            service = module.get<AntiCheatService>(AntiCheatService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("evaluate",
            () => {
                it("treats a missing telemetry payload as not suspicious (old clients)",
                    () => {
                        const result = service.evaluate({
                            // older clients submit nothing → no signal to score on
                            telemetry: undefined,
                            codeLength: 1000,
                        })

                        expect(result.suspicionScore).toBe(0)
                        expect(result.flagged).toBe(false)
                        expect(result.reasons).toEqual([])
                    })

                it("scores zero for organic editor behaviour",
                    () => {
                        const result = service.evaluate({
                            // typed by hand: lots of keystrokes, no big pastes, took a while
                            telemetry: {
                                pasteCount: 1,
                                pasteSizeMax: 10,
                                keystrokeCount: 800,
                                tabBlurCount: 0,
                                timeOpenToSubmitMs: 120_000,
                            },
                            codeLength: 600,
                        })

                        expect(result.suspicionScore).toBe(0)
                        expect(result.flagged).toBe(false)
                        expect(result.reasons).toEqual([])
                    })

                it("adds 25 for a high paste count (> 3)",
                    () => {
                        const result = service.evaluate({
                            // 4 pastes trips the repeated-paste heuristic; everything else benign
                            telemetry: {
                                pasteCount: 4,
                                pasteSizeMax: 0,
                                keystrokeCount: 800,
                                tabBlurCount: 0,
                                timeOpenToSubmitMs: 120_000,
                            },
                            codeLength: 600,
                        })

                        expect(result.suspicionScore).toBe(25)
                        expect(result.reasons).toEqual([
                            "high paste count (4)",
                        ])
                    })

                it("does NOT add the paste-count signal at the boundary (pasteCount === 3)",
                    () => {
                        const result = service.evaluate({
                            // exactly 3 is not > 3, so the heuristic stays silent
                            telemetry: {
                                pasteCount: 3,
                                pasteSizeMax: 0,
                                keystrokeCount: 800,
                                tabBlurCount: 0,
                                timeOpenToSubmitMs: 120_000,
                            },
                            codeLength: 600,
                        })

                        expect(result.suspicionScore).toBe(0)
                    })

                it("adds 30 when a single paste covers the majority (>= 60%) of the code",
                    () => {
                        const result = service.evaluate({
                            // 600 of 1000 chars in one paste = 60% → whole-solution paste
                            telemetry: {
                                pasteCount: 1,
                                pasteSizeMax: 600,
                                keystrokeCount: 800,
                                tabBlurCount: 0,
                                timeOpenToSubmitMs: 120_000,
                            },
                            codeLength: 1000,
                        })

                        expect(result.suspicionScore).toBe(30)
                        expect(result.reasons).toEqual([
                            "a single paste covers the majority of the solution",
                        ])
                    })

                it("ignores the big-paste signal when codeLength is 0",
                    () => {
                        const result = service.evaluate({
                            // guard: codeLength > 0 is required, so an empty solution scores nothing here
                            telemetry: {
                                pasteCount: 1,
                                pasteSizeMax: 5000,
                                keystrokeCount: 5000,
                                tabBlurCount: 0,
                                timeOpenToSubmitMs: 120_000,
                            },
                            codeLength: 0,
                        })

                        expect(result.suspicionScore).toBe(0)
                        expect(result.reasons).toEqual([])
                    })

                it("adds 25 when keystrokes are far below code length (< 30%)",
                    () => {
                        const result = service.evaluate({
                            // 100 keystrokes for 1000 chars = 10% → code was not typed
                            telemetry: {
                                pasteCount: 0,
                                pasteSizeMax: 0,
                                keystrokeCount: 100,
                                tabBlurCount: 0,
                                timeOpenToSubmitMs: 120_000,
                            },
                            codeLength: 1000,
                        })

                        expect(result.suspicionScore).toBe(25)
                        expect(result.reasons).toEqual([
                            "keystrokes far below code length (code likely not typed)",
                        ])
                    })

                it("adds 20 when non-trivial code is submitted within 15s of opening",
                    () => {
                        const result = service.evaluate({
                            // 300-char solution submitted in 10s is implausible to author
                            telemetry: {
                                pasteCount: 0,
                                pasteSizeMax: 0,
                                keystrokeCount: 800,
                                tabBlurCount: 0,
                                timeOpenToSubmitMs: 10_000,
                            },
                            codeLength: 300,
                        })

                        expect(result.suspicionScore).toBe(20)
                        expect(result.reasons).toEqual([
                            "non-trivial solution submitted within 15s of opening",
                        ])
                    })

                it("ignores the fast-submit signal for short solutions (codeLength <= 200)",
                    () => {
                        const result = service.evaluate({
                            // small solutions can legitimately be finished fast → no signal
                            telemetry: {
                                pasteCount: 0,
                                pasteSizeMax: 0,
                                keystrokeCount: 800,
                                tabBlurCount: 0,
                                timeOpenToSubmitMs: 1_000,
                            },
                            codeLength: 200,
                        })

                        expect(result.suspicionScore).toBe(0)
                    })

                it("ignores the fast-submit signal when the open-to-submit time is unknown (0)",
                    () => {
                        const result = service.evaluate({
                            // timeOpenToSubmitMs of 0 means "not measured", not "instant"
                            telemetry: {
                                pasteCount: 0,
                                pasteSizeMax: 0,
                                keystrokeCount: 800,
                                tabBlurCount: 0,
                                timeOpenToSubmitMs: 0,
                            },
                            codeLength: 600,
                        })

                        expect(result.suspicionScore).toBe(0)
                    })

                it("adds 15 for frequent tab focus loss (> 5)",
                    () => {
                        const result = service.evaluate({
                            // 6 blurs suggests repeatedly switching to an external AI tab
                            telemetry: {
                                pasteCount: 0,
                                pasteSizeMax: 0,
                                keystrokeCount: 800,
                                tabBlurCount: 6,
                                timeOpenToSubmitMs: 120_000,
                            },
                            codeLength: 600,
                        })

                        expect(result.suspicionScore).toBe(15)
                        expect(result.reasons).toEqual([
                            "frequent tab focus loss (6)",
                        ])
                    })

                it("flags once the aggregate crosses the threshold (>= 60)",
                    () => {
                        const result = service.evaluate({
                            // paste-count (25) + big-paste (30) + tab-blur (15) = 70 → flagged
                            telemetry: {
                                pasteCount: 4,
                                pasteSizeMax: 600,
                                keystrokeCount: 800,
                                tabBlurCount: 6,
                                timeOpenToSubmitMs: 120_000,
                            },
                            codeLength: 1000,
                        })

                        expect(result.suspicionScore).toBe(70)
                        expect(result.flagged).toBe(true)
                        expect(result.reasons).toHaveLength(3)
                    })

                it("does NOT flag just below the threshold (score 55)",
                    () => {
                        const result = service.evaluate({
                            // big-paste (30) + keystroke (25) = 55, one short of 60 → not flagged
                            telemetry: {
                                pasteCount: 0,
                                pasteSizeMax: 600,
                                keystrokeCount: 100,
                                tabBlurCount: 0,
                                timeOpenToSubmitMs: 120_000,
                            },
                            codeLength: 1000,
                        })

                        expect(result.suspicionScore).toBe(55)
                        expect(result.flagged).toBe(false)
                    })

                it("clamps the aggregate score to a maximum of 100",
                    () => {
                        const result = service.evaluate({
                            // every heuristic fires (25+30+25+20+15 = 115) → clamped to 100
                            telemetry: {
                                pasteCount: 10,
                                pasteSizeMax: 1000,
                                keystrokeCount: 1,
                                tabBlurCount: 20,
                                timeOpenToSubmitMs: 1_000,
                            },
                            codeLength: 1000,
                        })

                        expect(result.suspicionScore).toBe(100)
                        expect(result.flagged).toBe(true)
                        expect(result.reasons).toHaveLength(5)
                    })

                it("uses safe zero-defaults for omitted telemetry fields",
                    () => {
                        const result = service.evaluate({
                            // an empty telemetry object → every field defaults to 0; with a
                            // zero codeLength the length-relative heuristics are all guarded
                            // off, so the score stays 0
                            telemetry: {
                            },
                            codeLength: 0,
                        })

                        expect(result.suspicionScore).toBe(0)
                        expect(result.flagged).toBe(false)
                        expect(result.reasons).toEqual([])
                    })
            })
    })
