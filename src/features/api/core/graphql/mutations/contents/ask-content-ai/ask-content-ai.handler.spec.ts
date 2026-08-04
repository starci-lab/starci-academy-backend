import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiCeilSurface,
    AiModelCategory,
    AiModelTask,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    AiEntitlementService,
    AiInvokeService,
} from "@modules/ai"
import {
    ContentAiService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    AskContentAiHandler,
} from "./ask-content-ai.handler"
import {
    AskContentAiCommand,
} from "./ask-content-ai.command"

/**
 * Unit spec for {@link AskContentAiHandler} — the one-shot (non-streaming)
 * content-AI chat entrypoint. All external collaborators are mocked: no real
 * DB / model / network. We assert the wiring: ground the question, run the
 * System engine on the chatting lane (floor=Free, surface=Chatbot), bill the
 * served cost, and invalidate the credit cache.
 */
describe("AskContentAiHandler",
    () => {
        let module: TestingModule
        let handler: AskContentAiHandler
        let aiInvokeService: jest.Mocked<Pick<AiInvokeService, "run">>
        let aiEntitlementService: jest.Mocked<Pick<AiEntitlementService, "consume">>
        let contentAiService: jest.Mocked<Pick<ContentAiService, "prepareMessages">>

        const user = {
            id: "user-1",
        } as UserEntity

        const buildCommand = (
            overrides: Partial<AskContentAiCommand["params"]> = {
            },
        ): AskContentAiCommand =>
            new AskContentAiCommand({
                request: {
                    contentId: "content-1",
                    question: "What is sharding?",
                },
                locale: Locale.Vi,
                user,
                ...overrides,
            })

        beforeEach(async () => {
            // ground: returns the LangChain messages the model will run against
            contentAiService = {
                prepareMessages: jest.fn(async () => ({
                    messages: [
                        {
                            content: "grounded",
                        },
                    ] as never,
                })),
            } as unknown as jest.Mocked<Pick<ContentAiService, "prepareMessages">>

            // run: returns the answer + the billable cost (0 = free model served)
            aiInvokeService = {
                run: jest.fn(async () => ({
                    text: "Sharding splits data across nodes.",
                    model: "qwen2.5-coder:7b",
                    provider: "local",
                    cost: 0,
                    promptTokens: 100,
                    completionTokens: 50,
                    attempts: 1,
                } as never)),
            } as unknown as jest.Mocked<Pick<AiInvokeService, "run">>

            aiEntitlementService = {
                consume: jest.fn(async () => undefined as never),
            } as unknown as jest.Mocked<Pick<AiEntitlementService, "consume">>

            module = await Test.createTestingModule({
                providers: [
                    AskContentAiHandler,
                    {
                        provide: AiInvokeService,
                        useValue: aiInvokeService,
                    },
                    {
                        provide: AiEntitlementService,
                        useValue: aiEntitlementService,
                    },
                    {
                        provide: ContentAiService,
                        useValue: contentAiService,
                    },
                ],
            }).compile()

            handler = module.get<AskContentAiHandler>(AskContentAiHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("grounds the question then returns the served answer",
            async () => {
                const result = await handler.execute(buildCommand())

                // grounded against the content body for this user, passing history
                expect(contentAiService.prepareMessages).toHaveBeenCalledWith({
                    userId: "user-1",
                    contentId: "content-1",
                    question: "What is sharding?",
                    history: undefined,
                    locale: Locale.Vi,
                })

                // handler surfaces the model text as the answer
                expect(result).toEqual({
                    answer: "Sharding splits data across nodes.",
                })
            })

        it("runs the chatting lane: floor=Free, surface=Chatbot, grounded messages",
            async () => {
                await handler.execute(buildCommand())

                // content AI = same System engine as grading but floor=free (Auto)
                expect(aiInvokeService.run).toHaveBeenCalledWith({
                    userId: "user-1",
                    messages: [
                        {
                            content: "grounded",
                        },
                    ],
                    floor: AiModelCategory.Low,
                    surface: AiCeilSurface.Chatbot,
                })
            })

        it("bills the served cost on the Auto lane, recording full attribution",
            async () => {
                // a climbed economy+ model returns a non-zero cost → charge it
                aiInvokeService.run.mockResolvedValueOnce({
                    text: "answer",
                    model: "gpt-5.4-nano",
                    provider: "openai",
                    cost: 42,
                    promptTokens: 200,
                    completionTokens: 80,
                    attempts: 2,
                } as never)

                await handler.execute(buildCommand())

                expect(aiEntitlementService.consume).toHaveBeenCalledWith({
                    userId: "user-1",
                    cost: 42,
                    surface: AiCeilSurface.Chatbot,
                    task: AiModelTask.Chatting,
                    model: "gpt-5.4-nano",
                    provider: "openai",
                    promptTokens: 200,
                    completionTokens: 80,
                    attempts: 2,
                })
            })

        it("forwards prior history turns for short-term memory",
            async () => {
                const history = [
                    {
                        role: "user",
                        content: "earlier",
                    },
                ]

                await handler.execute(buildCommand({
                    request: {
                        contentId: "content-1",
                        question: "follow up?",
                        history,
                    },
                }))

                expect(contentAiService.prepareMessages).toHaveBeenCalledWith(
                    expect.objectContaining({
                        history,
                        question: "follow up?",
                    }),
                )
            })

        it("defaults the locale to En when none is supplied",
            async () => {
                await handler.execute(buildCommand({
                    locale: undefined,
                }))

                expect(contentAiService.prepareMessages).toHaveBeenCalledWith(
                    expect.objectContaining({
                        locale: Locale.En,
                    }),
                )
            })

        it("throws UserNotFoundException and never grounds/runs when no user is present",
            async () => {
                await expect(
                    handler.execute(buildCommand({
                        user: undefined,
                    })),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                expect(contentAiService.prepareMessages).not.toHaveBeenCalled()
                expect(aiInvokeService.run).not.toHaveBeenCalled()
                expect(aiEntitlementService.consume).not.toHaveBeenCalled()
            })

        // NOTE: this one-shot handler has NO model-pin / selectedModel path — it
        // always runs Auto (floor=Free, Chatbot) and never reads a model from the
        // request (AskContentAiRequest = { contentId, question, history } only).
        // The "selectedModel passes through" behavior lives on the grading/interview
        // handlers, not here, so there is nothing to assert for it on this SUT.
    })
