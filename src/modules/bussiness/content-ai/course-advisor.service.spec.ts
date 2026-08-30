import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CourseAdvisorService,
} from "./course-advisor.service"

const createService = () => {
    const elasticsearch = {
        indicateName: jest.fn().mockReturnValue("courses-en"),
        client: {
            search: jest.fn().mockResolvedValue({
                hits: {
                    hits: [
                        {
                            _source: {
                                displayId: "fullstack-mastery",
                                title: "Fullstack Mastery",
                                description: "Build production web applications.",
                                prerequisites: [
                                    {
                                        text: "JavaScript basics",
                                    },
                                ],
                                valuePropositions: [
                                    {
                                        text: "Frontend to backend",
                                    },
                                ],
                                modules: [
                                    {
                                        title: "Web foundations",
                                    },
                                ],
                            },
                        },
                    ],
                },
            }),
        },
    }
    const s3ReadService = {
        json: jest.fn(),
    }
    const s3NameResolverService = {
        course: jest.fn(),
    }
    return {
        service: new CourseAdvisorService(
            elasticsearch as never,
            s3ReadService as never,
            s3NameResolverService as never,
        ),
        elasticsearch,
    }
}

describe("CourseAdvisorService",
    () => {
        it("adds only public catalog facts and the typed envelope contract to the prompt",
            async () => {
                const { service } = createService()

                const result = await service.prepareMessages({
                    messages: [
                        new SystemMessage("Base tutor policy"),
                        new HumanMessage("I want to become a fullstack developer"),
                    ],
                    question: "I want to become a fullstack developer",
                    locale: Locale.En,
                })

                expect(result.candidateDisplayIds).toEqual(["fullstack-mastery"])
                expect(result.messages[0].content).toContain("Base tutor policy")
                expect(result.messages[0].content).toContain("Fullstack Mastery")
                expect(result.messages[0].content).not.toContain("originalPrice")
                expect(result.messages[0].content).toContain("starci-course-advisor")
            })

        it("keeps the useful answer while accepting only current candidate ids",
            () => {
                const { service } = createService()
                const parsed = service.parseResponse({
                    answer: [
                        "Fullstack is a reasonable path for your goal.",
                        "<!--starci-course-advisor:{\"intent\":\"recommend\",\"clarificationQuestion\":null,\"recommendations\":[{\"courseDisplayId\":\"invented-course\",\"reason\":\"Not allowed\",\"fitGap\":null,\"confidence\":\"high\"},{\"courseDisplayId\":\"fullstack-mastery\",\"reason\":\"Matches a frontend-to-backend goal\",\"fitGap\":\"Requires JavaScript basics\",\"confidence\":\"high\"}]}-->",
                    ].join("\n"),
                    candidateDisplayIds: ["fullstack-mastery"],
                })

                expect(parsed.answer).toBe("Fullstack is a reasonable path for your goal.")
                expect(parsed.metadata?.recommendations).toEqual([
                    {
                        courseDisplayId: "fullstack-mastery",
                        reason: "Matches a frontend-to-backend goal",
                        fitGap: "Requires JavaScript basics",
                        confidence: "high",
                    },
                ])
            })

        it("strips a malformed hidden envelope instead of leaking protocol copy",
            () => {
                const { service } = createService()
                const parsed = service.parseResponse({
                    answer: "Useful answer\n<!--starci-course-advisor:{not-json}-->",
                })

                expect(parsed.answer).toBe("Useful answer")
                expect(parsed.metadata).toBeUndefined()
            })
    })
