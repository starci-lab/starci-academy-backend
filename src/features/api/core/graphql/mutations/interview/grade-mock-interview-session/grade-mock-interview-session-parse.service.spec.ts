import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/platform/exceptions/errors/ai/parsing-criteria-results-from-model-text"
import {
    GradeMockInterviewSessionParseService,
} from "./grade-mock-interview-session-parse.service"
import {
    MockInterviewVerdict,
} from "./types/mock-interview-grade"

describe("GradeMockInterviewSessionParseService",
    () => {
        const service = new GradeMockInterviewSessionParseService()

        it("extracts provider JSON and normalizes every supported scorecard field",
            () => {
                const result = service.parse(`Result:\n\`\`\`json\n${JSON.stringify({
                    overallScore: "81.6",
                    verdict: " PASS ",
                    phaseScores: [
                        {
                            phase: "requirements",
                            score: 120,
                            max: 20,
                        },
                    ],
                    attributeScores: [
                        {
                            key: "communication",
                            score: -2,
                        },
                    ],
                    strengths: ["  concrete strength  ",
                        ""],
                    gaps: [" specific gap "],
                    followUpQuestion: "  Why?  ",
                    questionFeedback: [
                        {
                            index: "1",
                            feedback: "  Add evidence.  ",
                        },
                    ],
                    coveredCheckpoints: [
                        {
                            index: 1.9,
                            covered: ["0",
                                2.8,
                                -1,
                                "bad"],
                        },
                    ],
                })}\n\`\`\``)

                expect(result).toEqual({
                    overallScore: 82,
                    verdict: MockInterviewVerdict.Pass,
                    phaseScores: [
                        {
                            phase: "requirements",
                            score: 20,
                            max: 20,
                        },
                    ],
                    attributeScores: [
                        {
                            key: "communication",
                            score: 0,
                        },
                    ],
                    strengths: ["concrete strength"],
                    gaps: ["specific gap"],
                    followUpQuestion: "Why?",
                    questionFeedback: [
                        {
                            index: 1,
                            feedback: "Add evidence.",
                        },
                    ],
                    coveredCheckpoints: [
                        {
                            index: 1,
                            covered: [0,
                                2],
                        },
                    ],
                })
            })

        it.each([
            [75,
                MockInterviewVerdict.Pass],
            [50,
                MockInterviewVerdict.Borderline],
            [49,
                MockInterviewVerdict.Fail],
        ])("derives a verdict from normalized score %s",
            (score, verdict) => {
                expect(service.normalizeVerdict("unknown",
                    score)).toBe(verdict)
            })

        it("degrades malformed optional provider fields without inventing content",
            () => {
                expect(service.parse(JSON.stringify({
                    overallScore: "not-a-number",
                    phaseScores: "bad",
                    attributeScores: null,
                    strengths: {
                    },
                    gaps: [null],
                    followUpQuestion: "   ",
                    questionFeedback: [null,
                        {
                            index: "bad",
                            feedback: 1,
                        }],
                    coveredCheckpoints: {
                    },
                }))).toEqual({
                    overallScore: 0,
                    verdict: MockInterviewVerdict.Fail,
                    phaseScores: [],
                    attributeScores: [],
                    strengths: [],
                    gaps: [],
                    followUpQuestion: null,
                    questionFeedback: [],
                    coveredCheckpoints: [],
                })
            })

        it("throws the domain parse exception for invalid provider JSON",
            () => {
                expect(() => service.parse("not-json")).toThrow(ParsingCriteriaResultsFromModelTextException)
            })

        it("normalizes an out-of-range numeric score to the bounded scale",
            () => {
                const result = service.parse(JSON.stringify({
                    overallScore: 150,
                    verdict: "pass",
                }))

                expect(result.overallScore).toBe(100)
                expect(result.verdict).toBe(MockInterviewVerdict.Pass)
            })
    })
