import {
    parseChallengeEvaluation
} from "./parse-challenge-evaluation"

const criteria = [
    {
        body: "Critical contract",
        score: 70,
        critical: true,
        kind: "approach" as const,
    },
    {
        body: "Observable outcome",
        score: 30,
        critical: false,
        kind: "outcome" as const,
    },
]

const evaluation = (overrides: Record<string, unknown> = {
}) =>
    JSON.stringify({
        shortFeedback: "Evidence reviewed.",
        score: 999,
        details: [
            {
                criteriaId: "0",
                met: true,
                feedbacks: [
                    {
                        severity: "low",
                        message: "Met",
                        location: "src/app.ts:10",
                        suggestion: null,
                    },
                ],
            },
            {
                criteriaId: "1",
                met: false,
                feedbacks: [
                    {
                        severity: "high",
                        message: "Missing",
                        location: "docs/design.md:4",
                        suggestion: "Add it",
                    },
                ],
            },
        ],
        ...overrides,
    })

describe("parseChallengeEvaluation strict platform finalization",
    () => {
        it("derives score from the frozen rubric instead of trusting the model score",
            () => {
                const result = parseChallengeEvaluation(evaluation(),
                    {
                        criteria,
                        source: "code",
                    })
                expect(result.score).toBe(70)
                expect(result.confidence).toBe(1)
            })

        it("zeroes the canonical score when a critical criterion is not met",
            () => {
                const result = parseChallengeEvaluation(
                    evaluation({
                        details: [
                            {
                                criteriaId: "0",
                                met: false,
                                feedbacks: [
                                    {
                                        severity: "high",
                                        message: "Missing",
                                        location: "src/app.ts:10",
                                        suggestion: "Implement it",
                                    },
                                ],
                            },
                            {
                                criteriaId: "1",
                                met: true,
                                feedbacks: [
                                    {
                                        severity: "low",
                                        message: "Met",
                                        location: "src/app.ts:20",
                                        suggestion: null,
                                    },
                                ],
                            },
                        ],
                    }),
                    {
                        criteria,
                        source: "code",
                    },
                )
                expect(result.score).toBe(0)
            })

        it.each([
            {
                name: "missing criterion",
                details: [],
            },
            {
                name: "wrong criterion identity",
                details: [
                    {
                        criteriaId: "1",
                        met: true,
                        feedbacks: [
                            {
                                severity: "low",
                                message: "Met",
                                location: "x:1",
                                suggestion: null,
                            },
                        ],
                    },
                    {
                        criteriaId: "0",
                        met: true,
                        feedbacks: [
                            {
                                severity: "low",
                                message: "Met",
                                location: "x:2",
                                suggestion: null,
                            },
                        ],
                    },
                ],
            },
            {
                name: "non-boolean decision",
                details: [
                    {
                        criteriaId: "0",
                        met: "yes",
                        feedbacks: [
                            {
                                severity: "low",
                                message: "Met",
                                location: "x:1",
                                suggestion: null,
                            },
                        ],
                    },
                    {
                        criteriaId: "1",
                        met: true,
                        feedbacks: [
                            {
                                severity: "low",
                                message: "Met",
                                location: "x:2",
                                suggestion: null,
                            },
                        ],
                    },
                ],
            },
        ])("rejects malformed structured evidence: $name",
            ({ details }) => {
                expect(() =>
                    parseChallengeEvaluation(
                        evaluation({
                            details,
                        }),
                        {
                            criteria,
                            source: "code",
                        },
                    ),
                ).toThrow("Could not parse per-criteria grading JSON from model response")
            })

        it("reports low confidence when evidence and recovery advice are absent",
            () => {
                const result = parseChallengeEvaluation(
                    evaluation({
                        details: [
                            {
                                criteriaId: "0",
                                met: true,
                                feedbacks: [
                                    {
                                        severity: "low",
                                        message: "Met",
                                        location: null,
                                        suggestion: null,
                                    },
                                ],
                            },
                            {
                                criteriaId: "1",
                                met: false,
                                feedbacks: [
                                    {
                                        severity: "high",
                                        message: "Missing",
                                        location: null,
                                        suggestion: null,
                                    },
                                ],
                            },
                        ],
                    }),
                    {
                        criteria,
                        source: "code",
                    },
                )
                expect(result.confidence).toBe(0.25)
            })
    })
