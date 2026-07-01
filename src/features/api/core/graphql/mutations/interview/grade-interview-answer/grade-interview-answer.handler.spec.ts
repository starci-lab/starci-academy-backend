import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiMode,
    Locale,
    ModelProvider,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    InterviewGradingService,
} from "@modules/bussiness"
import {
    InterviewVerdict,
} from "@modules/bussiness"
import {
    UserEntity,
} from "@modules/databases"
import {
    GradeInterviewAnswerHandler,
} from "./grade-interview-answer.handler"
import {
    GradeInterviewAnswerCommand,
} from "./grade-interview-answer.command"
import {
    GradeInterviewAnswerRequest,
} from "./graphql-types"

/**
 * The handler is a thin delegate: it unpacks the command, guards on the user,
 * forwards the lane pick (mode + selectedModel/provider) into
 * {@link InterviewGradingService.grade}, and maps the domain result 1:1 onto the
 * GraphQL data shape. The lane *validation* itself lives inside the service, so
 * here we assert the handler hands the pick through untouched (and omits it on
 * the bare Auto lane) — the service spec covers validation wiring.
 */
const buildResult = () => ({
    score: 82,
    verdict: InterviewVerdict.Pass,
    strengths: [
        "clear tradeoff reasoning",
    ],
    gaps: [
        "missed idempotency",
    ],
    modelAnswerHint: "mention dedup keys",
    followUpQuestion: "how would you shard?",
})

const buildRequest = (
    overrides: Partial<GradeInterviewAnswerRequest> = {
    },
): GradeInterviewAnswerRequest => ({
    flashcardDeckId: "deck-1",
    flashcardCardId: "card-1",
    transcript: "my answer",
    ...overrides,
}) as GradeInterviewAnswerRequest

describe("GradeInterviewAnswerHandler",
    () => {
        let module: TestingModule
        let handler: GradeInterviewAnswerHandler
        let interviewGradingService: jest.Mocked<Pick<InterviewGradingService, "grade">>

        const user = {
            id: "user-1",
        } as UserEntity

        beforeEach(async () => {
            interviewGradingService = {
                grade: jest.fn(async () => buildResult()),
            } as unknown as jest.Mocked<Pick<InterviewGradingService, "grade">>

            module = await Test.createTestingModule({
                providers: [
                    GradeInterviewAnswerHandler,
                    {
                        provide: InterviewGradingService,
                        useValue: interviewGradingService,
                    },
                ],
            }).compile()

            handler = module.get<GradeInterviewAnswerHandler>(GradeInterviewAnswerHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("forwards an explicit Premium model pick through into the grade call",
            async () => {
                // a concrete (selectedModel, provider) pick + Premium mode must reach
                // grade() unchanged so the service can lane-validate it
                await handler.execute(
                    new GradeInterviewAnswerCommand({
                        request: buildRequest({
                            interviewSessionId: "sess-1",
                            mode: AiMode.Premium,
                            selectedModel: "gpt-4o",
                            selectedModelProvider: ModelProvider.OpenAI,
                        }),
                        user,
                        locale: Locale.Vi,
                    }),
                )

                expect(interviewGradingService.grade).toHaveBeenCalledWith({
                    userId: "user-1",
                    flashcardDeckId: "deck-1",
                    flashcardCardId: "card-1",
                    interviewSessionId: "sess-1",
                    transcript: "my answer",
                    locale: Locale.Vi,
                    mode: AiMode.Premium,
                    selectedModel: "gpt-4o",
                    selectedModelProvider: ModelProvider.OpenAI,
                })
            })

        it("omits the model pick on the bare Auto lane (no model/provider)",
            async () => {
                // Auto with no pick → selectedModel/provider flow through as undefined,
                // i.e. nothing for the service to validate (balancer default)
                await handler.execute(
                    new GradeInterviewAnswerCommand({
                        request: buildRequest({
                            mode: AiMode.Auto,
                        }),
                        user,
                        locale: Locale.En,
                    }),
                )

                const passed = interviewGradingService.grade.mock.calls[0][0]
                expect(passed.mode).toBe(AiMode.Auto)
                expect(passed.selectedModel).toBeUndefined()
                expect(passed.selectedModelProvider).toBeUndefined()
            })

        it("defaults the locale to En when the command carries none",
            async () => {
                // locale is optional on the command → handler falls back to En
                await handler.execute(
                    new GradeInterviewAnswerCommand({
                        request: buildRequest(),
                        user,
                    }),
                )

                expect(interviewGradingService.grade).toHaveBeenCalledWith(
                    expect.objectContaining({
                        locale: Locale.En,
                        selectedModel: undefined,
                        selectedModelProvider: undefined,
                    }),
                )
            })

        it("maps the domain grade result 1:1 onto the GraphQL data shape",
            async () => {
                const result = await handler.execute(
                    new GradeInterviewAnswerCommand({
                        request: buildRequest(),
                        user,
                        locale: Locale.En,
                    }),
                )

                expect(result).toEqual({
                    score: 82,
                    verdict: InterviewVerdict.Pass,
                    strengths: [
                        "clear tradeoff reasoning",
                    ],
                    gaps: [
                        "missed idempotency",
                    ],
                    modelAnswerHint: "mention dedup keys",
                    followUpQuestion: "how would you shard?",
                })
            })

        it("throws UserNotFoundException and never grades when the user is absent",
            async () => {
                await expect(
                    handler.execute(
                        new GradeInterviewAnswerCommand({
                            request: buildRequest(),
                            locale: Locale.En,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                expect(interviewGradingService.grade).not.toHaveBeenCalled()
            })
    })
