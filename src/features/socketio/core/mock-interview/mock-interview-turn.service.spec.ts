import {
    MockInterviewTurnService
} from "./mock-interview-turn.service"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MockInterviewMode
} from "@modules/databases/postgresql/primary/enums/mock-interview-mode"
import {
    MockInterviewPhase
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"
import {
    MockInterviewKind
} from "@modules/databases/postgresql/primary/enums/mock-interview-kind"
const base = (mode: MockInterviewMode) => ({
    courseId: "c1",
    promptTitle: "Distributed systems",
    mode,
    phase: MockInterviewPhase.Requirements,
    history: [],
    latestAnswer: "",
    locale: Locale.En,
})
describe("MockInterviewTurnService",
    () => {
        it("builds a grounded design prompt using title on opening turn",
            async () => {
                const rag = {
                    retrieveCourseExcerpt: jest
                        .fn()
                        .mockResolvedValue({
                            excerpt: "CAP theorem"
                        }),
                }
                const result = await new MockInterviewTurnService(rag as never).prepareTurn(
                    base(MockInterviewMode.Design),
                )
                expect(rag.retrieveCourseExcerpt).toHaveBeenCalledWith({
                    courseId: "c1",
                    query: "Distributed systems",
                    topK: 8,
                })
                expect(result.messages[0].content).toContain("CAP theorem")
                expect(result.messages[1].content).toContain("no turns yet")
            })
        it("builds qna follow-up from stable seed and normalizes missing kind",
            async () => {
                const rag = {
                    retrieveCourseExcerpt: jest.fn().mockResolvedValue({
                        excerpt: "queues"
                    }),
                }
                const p = {
                    ...base(MockInterviewMode.Qna),
                    currentSeed: "Message queues",
                    questionIndex: 1,
                    latestAnswer: "I used Kafka",
                    kind: null,
                    level: "senior",
                }
                const result = await new MockInterviewTurnService(rag as never).prepareTurn(
                    p,
                )
                expect(rag.retrieveCourseExcerpt).toHaveBeenCalledWith({
                    courseId: "c1",
                    query: "Message queues",
                    topK: 5,
                })
                expect(result.messages[0].content).toContain("follow-up")
                expect(result.messages[0].content).toContain("Senior")
            })
        it("delivers authored qna prompts verbatim on opening ask",
            async () => {
                const rag = {
                    retrieveCourseExcerpt: jest.fn().mockResolvedValue({
                        excerpt: ""
                    }),
                }
                const authored =
      "Explain this architecture\n```mermaid\ngraph TD\nA-->B\n```"
                const result = await new MockInterviewTurnService(rag as never).prepareTurn(
                    {
                        ...base(MockInterviewMode.Qna),
                        currentSeed: authored,
                        kind: MockInterviewKind.Theory,
                        questionIndex: 0,
                    },
                )
                expect(result.messages[0].content).toContain("Preserve EVERY code block")
                expect(result.messages[0].content).toContain(authored)
            })

        it("grounds a design follow-up on the latest answer and degrades to a generic prompt",
            async () => {
                const rag = {
                    retrieveCourseExcerpt: jest.fn().mockResolvedValue({
                        excerpt: "",
                    }),
                }
                const result = await new MockInterviewTurnService(rag as never).prepareTurn({
                    ...base(MockInterviewMode.Design),
                    locale: Locale.Vi,
                    latestAnswer: "I would partition by tenant",
                    history: [{
                        role: "candidate",
                        content: "I would partition by tenant",
                    }],
                    level: "staff",
                } as never)

                expect(rag.retrieveCourseExcerpt).toHaveBeenCalledWith({
                    courseId: "c1",
                    query: "I would partition by tenant",
                    topK: 8,
                })
                expect(result.messages[0].content).toContain("Vietnamese")
                expect(result.messages[0].content).toContain("Staff / Architect")
                expect(result.messages[0].content).toContain("excerpt below is EMPTY")
                expect(result.messages[1].content).toContain("candidate: I would partition by tenant")
            })

        it("falls back to an English theory opening for an empty seed and unknown options",
            async () => {
                const rag = {
                    retrieveCourseExcerpt: jest.fn().mockResolvedValue({
                        excerpt: "queues",
                    }),
                }
                const result = await new MockInterviewTurnService(rag as never).prepareTurn({
                    ...base(MockInterviewMode.Qna),
                    currentSeed: "   ",
                    kind: "unrecognized",
                    level: "principal",
                } as never)

                expect(rag.retrieveCourseExcerpt).toHaveBeenCalledWith({
                    courseId: "c1",
                    query: "Distributed systems",
                    topK: 5,
                })
                expect(result.messages[0].content).toContain("in **English**")
                expect(result.messages[0].content).toContain("THEORY")
                expect(result.messages[0].content).toContain("OPENING ask")
                expect(result.messages[1].content).toContain("no turns yet")
            })
    })
