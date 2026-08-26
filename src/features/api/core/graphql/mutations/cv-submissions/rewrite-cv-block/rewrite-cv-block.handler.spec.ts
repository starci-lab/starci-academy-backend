import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    CvBlockNotFoundException,
} from "@modules/platform/exceptions/errors/cv/cv-block-not-found"
import {
    CvModelOutputParseException,
} from "@modules/platform/exceptions/errors/cv/cv-model-output-parse"
import {
    CvModelOutputShapeException,
} from "@modules/platform/exceptions/errors/cv/cv-model-output-shape"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    RewriteCvBlockCommand,
} from "./rewrite-cv-block.command"
import {
    RewriteCvBlockHandler,
} from "./rewrite-cv-block.handler"

const block = {
    id: "block-1",
    type: "experience",
    title: "Backend",
    order: 2,
    items: ["Built APIs"],
}

const makeHandler = (raw = JSON.stringify({
    title: "Staff backend engineer",
    items: ["Built reliable APIs",
        42,
        "Improved latency"],
})) => {
    const entityManager = {
        query: jest.fn().mockResolvedValue([]),
    }
    const aiInvokeService = {
        run: jest.fn().mockResolvedValue({
            text: raw
        }),
    }
    const gradingLaneValidationService = {
        validate: jest.fn().mockResolvedValue({
            gradingModel: "gpt-test",
            gradingProvider: ModelProvider.OpenAI,
        }),
    }
    return {
        handler: new RewriteCvBlockHandler(
            entityManager as never,
            aiInvokeService as never,
            gradingLaneValidationService as never,
        ),
        entityManager,
        aiInvokeService,
        gradingLaneValidationService,
    }
}

describe("RewriteCvBlockHandler",
    () => {
        it("rewrites a block with capstone grounding and preserves identity fields",
            async () => {
                const harness = makeHandler("```json\n"
            + JSON.stringify({
                title: "Staff backend engineer",
                items: ["Built reliable APIs",
                    42,
                    "Improved latency"],
            })
            + "\n```")
                harness.entityManager.query.mockResolvedValue([{
                    task_title: "Build an API",
                    task_description: "Ship the enrollment API",
                    milestone_title: "Backend foundations",
                    course_title: "NestJS",
                    score: 92,
                    short_feedback: "Strong error handling",
                }])

                const result = await harness.handler.execute(new RewriteCvBlockCommand({
                    request: {
                        block,
                        capstoneAttemptId: "attempt-1",
                        instruction: "  quantify the impact  ",
                        selectedModel: "gpt-test",
                        selectedModelProvider: ModelProvider.OpenAI,
                    },
                    user: {
                        id: "user-1"
                    } as never,
                    locale: Locale.Vi,
                }))

                expect(result.block).toEqual({
                    id: "block-1",
                    type: "experience",
                    order: 2,
                    title: "Staff backend engineer",
                    items: ["Built reliable APIs",
                        "Improved latency"],
                })
                expect(harness.entityManager.query).toHaveBeenCalledWith(
                    expect.stringContaining("WHERE mta.id = $1 AND e.user_id = $2"),
                    ["attempt-1",
                        "user-1"],
                )
                expect(harness.gradingLaneValidationService.validate).toHaveBeenCalledWith({
                    userId: "user-1",
                    model: "gpt-test",
                    provider: ModelProvider.OpenAI,
                })
                expect(harness.aiInvokeService.run).toHaveBeenCalledWith(expect.objectContaining({
                    userId: "user-1",
                    selection: {
                        model: "gpt-test",
                        provider: ModelProvider.OpenAI,
                    },
                }))
                const messages = harness.aiInvokeService.run.mock.calls[0][0].messages as Array<{ content: string }>
                expect(messages[0].content).toContain("Vietnamese (Tiếng Việt)")
                expect(messages[0].content).toContain("Build an API")
                expect(messages[0].content).toContain("quantify the impact")
            })

        it("uses English/no-grounding defaults and falls back to original title/order values",
            async () => {
                const harness = makeHandler(JSON.stringify({
                    id: "model-id",
                    type: "model-type",
                    title: "",
                    order: "bad",
                    items: [],
                }))
                const result = await harness.handler.execute(new RewriteCvBlockCommand({
                    request: {
                        block,
                        instruction: "   ",
                    },
                    user: {
                        id: "user-1"
                    } as never,
                }))

                expect(result.block).toEqual({
                    id: "block-1",
                    type: "experience",
                    order: 2,
                    title: "Backend",
                    items: [],
                })
                expect(harness.entityManager.query).not.toHaveBeenCalled()
                const messages = harness.aiInvokeService.run.mock.calls[0][0].messages as Array<{ content: string }>
                expect(messages[0].content).toContain("English")
                expect(messages[0].content).not.toContain("## User instruction")
            })

        it("rejects missing users, blocks, malformed JSON, and non-object model output",
            async () => {
                const harness = makeHandler()
                await expect(harness.handler.execute(new RewriteCvBlockCommand({
                    request: {
                        block
                    },
                }))).rejects.toThrow(UserNotFoundException)
                await expect(harness.handler.execute(new RewriteCvBlockCommand({
                    request: {
                        block: null as never
                    },
                    user: {
                        id: "user-1"
                    } as never,
                }))).rejects.toThrow(CvBlockNotFoundException)

                const badJson = makeHandler("not json")
                await expect(badJson.handler.execute(new RewriteCvBlockCommand({
                    request: {
                        block
                    },
                    user: {
                        id: "user-1"
                    } as never,
                }))).rejects.toThrow(CvModelOutputParseException)

                const badShape = makeHandler("[]")
                await expect(badShape.handler.execute(new RewriteCvBlockCommand({
                    request: {
                        block
                    },
                    user: {
                        id: "user-1"
                    } as never,
                }))).rejects.toThrow(CvModelOutputShapeException)
            })

        it("preserves model identity when the original block omits it and filters non-array items",
            async () => {
                const harness = makeHandler(JSON.stringify({
                    id: "generated-id",
                    type: "summary",
                    order: 4,
                    title: 42,
                    items: "not-an-array",
                }))

                const result = await harness.handler.execute(new RewriteCvBlockCommand({
                    request: {
                        block: {
                        },
                    },
                    user: {
                        id: "user-1",
                    } as never,
                }))

                expect(result.block).toEqual({
                    id: "generated-id",
                    type: "summary",
                    order: 4,
                    title: "",
                    items: [],
                })
                expect(harness.gradingLaneValidationService.validate).toHaveBeenCalledWith(expect.objectContaining({
                    userId: "user-1",
                }))
            })
    })
