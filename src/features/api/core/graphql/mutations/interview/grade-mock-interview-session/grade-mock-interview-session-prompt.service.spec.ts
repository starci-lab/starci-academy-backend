import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MockInterviewKind,
} from "@modules/databases/postgresql/primary/enums/mock-interview-kind"
import {
    MockInterviewMode,
} from "@modules/databases/postgresql/primary/enums/mock-interview-mode"
import {
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"
import type {
    BuildMockInterviewGradePromptParams,
    MockInterviewSeedGrounding,
    MockInterviewTurnRecord,
} from "./types/mock-interview-grade"
import {
    MockInterviewGradePromptService,
} from "./grade-mock-interview-session-prompt.service"

const turn = (
    role: string,
    content: string,
    questionIndex?: number,
): MockInterviewTurnRecord => ({
    role,
    content,
    phase: MockInterviewPhase.Requirements,
    ...(questionIndex === undefined ? {
    } : {
        questionIndex 
    }),
})

const baseParams = (
    overrides: Partial<BuildMockInterviewGradePromptParams> = {
    },
): BuildMockInterviewGradePromptParams => ({
    promptTitle: "Design a resilient job queue",
    mode: MockInterviewMode.Design,
    level: "middle",
    turns: [
        turn("interviewer",
            "How would you clarify the requirements?"),
        turn("candidate",
            "I would establish latency, durability, and retry goals."),
    ],
    courseExcerpt: "Queues absorb bursts and workers must process messages idempotently.",
    seedGroundings: [],
    locale: Locale.En,
    ...overrides,
})

const messageContent = (
    service: MockInterviewGradePromptService,
    params: BuildMockInterviewGradePromptParams,
): { system: string, human: string } => {
    const messages = service.build(params).messages
    return {
        system: String(messages[0].content),
        human: String(messages[1].content),
    }
}

describe("MockInterviewGradePromptService — design prompts",
    () => {
        it("builds a grounded five-phase scorecard with transcript and output contract",
            () => {
                const service = new MockInterviewGradePromptService()
                const result = messageContent(service,
                    baseParams())

                expect(result.system).toContain("completed a full mock interview about \"Design a resilient job queue\"")
                expect(result.system).toContain("Middle — expect the concepts applied correctly in practice with some nuance.")
                expect(result.system).toContain("## Workspace artifacts (first-class evidence)")
                expect(result.system).toContain("## Speech-to-text caveat")
                expect(result.system).toContain("## The 5-phase rubric")
                expect(result.system).toContain("Queues absorb bursts")
                expect(result.system).toContain("\"verdict\": \"borderline\"")
                expect(result.system).toContain("Output STRICT JSON only")
                expect(result.human).toContain("[requirements] interviewer: How would you clarify the requirements?")
                expect(result.human).toContain("[requirements] candidate: I would establish latency")
            })

        it("uses English and general-practice fallbacks for unknown level, locale, and empty transcript/material",
            () => {
                const service = new MockInterviewGradePromptService()
                const result = messageContent(service,
                    baseParams({
                        level: "  director  ",
                        locale: "fr" as Locale,
                        turns: [],
                        courseExcerpt: "   ",
                    }))

                expect(result.system).toContain("Unspecified level — grade the substance on its own merits.")
                expect(result.system).toContain("Write strengths, gaps, and followUpQuestion in **English**.")
                expect(result.system).toContain("No course material was retrieved")
                expect(result.human).toContain("(no turns were recorded for this session)")
            })
    })

describe("MockInterviewGradePromptService — Q&A prompts",
    () => {
        const checkpointGrounding: MockInterviewSeedGrounding = {
            cardId: "card-theory",
            kind: MockInterviewKind.Theory,
            question: "What does an index provide?",
            answer: "An index accelerates lookups by maintaining an ordered structure.",
            keywords: ["lookup",
                "ordered structure"],
            rubric: ["Explain the lookup benefit"],
            checkpoints: [
                {
                    text: "Explains the lookup benefit",
                    dimension: "technical",
                    critical: true,
                    scoreBand: 60,
                },
                {
                    text: "Names the maintenance trade-off",
                    dimension: null,
                    critical: false,
                    scoreBand: 40,
                },
            ],
            givenCode: "return rows.filter(Boolean)",
            givenLang: "typescript",
        }

        const rubricGrounding: MockInterviewSeedGrounding = {
            cardId: "card-reasoning",
            kind: MockInterviewKind.Reasoning,
            question: "When would you choose a queue?",
            answer: null,
            keywords: [],
            rubric: ["Identify the burst-handling trade-off",
                "Explain when synchronous work is better"],
        }

        const openGrounding: MockInterviewSeedGrounding = {
            cardId: "card-scenario",
            kind: MockInterviewKind.Scenario,
            question: "Production latency suddenly spikes; what do you do?",
            answer: null,
            keywords: [],
        }

        it("groups turns and emits each question's own kind, reference, checkpoints, and transcript",
            () => {
                const service = new MockInterviewGradePromptService()
                const result = messageContent(service,
                    baseParams({
                        mode: MockInterviewMode.Qna,
                        level: " STAFF ",
                        locale: Locale.Vi,
                        turns: [
                            turn("interviewer",
                                "What does an index provide?",
                                0),
                            turn("candidate",
                                "It makes lookups faster.",
                                0),
                            turn("candidate",
                                "It may cost writes.",
                                0),
                            turn("interviewer",
                                "When would you choose a queue?",
                                1),
                            turn("candidate",
                                "For bursts and decoupling.",
                                1),
                            turn("interviewer",
                                "Production latency suddenly spikes; what do you do?",
                                2),
                            turn("candidate",
                                "Check metrics, isolate the dependency, and mitigate.",
                                2),
                            turn("candidate",
                                "This turn has no question and must be dropped"),
                        ],
                        seedGroundings: [checkpointGrounding,
                            rubricGrounding,
                            openGrounding],
                        courseExcerpt: "The course recommends queues for burst isolation.",
                    }))

                expect(result.system).toContain("mock interview (\"Design a resilient job queue\") made of SEPARATE")
                expect(result.system).toContain("Staff / Architect")
                expect(result.system).toContain("Write strengths, gaps, followUpQuestion, and questionFeedback[].feedback in **Vietnamese (Tiếng Việt)**.")
                expect(result.system).toContain("EXACTLY one entry PER QUESTION")
                expect(result.human).toContain("### Question 1")
                expect(result.human).toContain("Rubric — THEORY")
                expect(result.human).toContain("Reference (scoring CHECKPOINTS")
                expect(result.human).toContain("(0) [technical, MUST-HIT, 60 pts]")
                expect(result.human).toContain("Reference (the GIVEN code")
                expect(result.human).toContain("Reference (keywords worth covering): lookup, ordered structure")
                expect(result.human).toContain("### Question 2")
                expect(result.human).toContain("Rubric — REASONING")
                expect(result.human).toContain("(2) Explain when synchronous work is better")
                expect(result.human).toContain("### Question 3")
                expect(result.human).toContain("Rubric — SCENARIO")
                expect(result.human).not.toContain("Reference (question): Production latency suddenly spikes")
                expect(result.human).toContain("candidate: Check metrics, isolate the dependency, and mitigate.")
            })

        it("falls back safely for missing or unknown groundings and records empty question transcripts",
            () => {
                const service = new MockInterviewGradePromptService()
                const result = messageContent(service,
                    baseParams({
                        mode: MockInterviewMode.Qna,
                        level: null,
                        seedGroundings: [{
                            ...openGrounding,
                            kind: "future-kind",
                            answer: "A future answer",
                        },
                        {
                            ...openGrounding,
                            cardId: "card-missing",
                            kind: MockInterviewKind.Theory,
                            question: "A seed with no transcript",
                            answer: "A model answer",
                        }],
                        turns: [turn("candidate",
                            "An answer",
                            0)],
                        courseExcerpt: "material",
                    }))

                expect(result.system).toContain("Unspecified level — grade the substance on its own merits.")
                expect(result.human).toContain("Rubric — THEORY")
                expect(result.human).toContain("Reference (question): Production latency suddenly spikes; what do you do?")
                expect(result.human).toContain("### Question 2")
                expect(result.human).toContain("Reference (question): A seed with no transcript")
                expect(result.human).toContain("(no turns recorded for this question)")
            })

        it("uses the legacy rubric when checkpoints are absent and keeps empty references for open questions",
            () => {
                const service = new MockInterviewGradePromptService()
                const result = messageContent(service,
                    baseParams({
                        mode: MockInterviewMode.Qna,
                        turns: [turn("candidate",
                            "A reasoned answer",
                            0),
                        turn("candidate",
                            "An open answer",
                            1)],
                        seedGroundings: [rubricGrounding,
                            openGrounding],
                    }))

                expect(result.human).toContain("Reference (scoring reasoning points")
                expect(result.human).toContain("(2) Explain when synchronous work is better")
                expect(result.human).not.toContain("Reference (keywords worth covering)")
                expect(result.human).toContain("Rubric — SCENARIO")
            })
    })
