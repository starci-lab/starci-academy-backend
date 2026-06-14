import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    InterviewGradingService,
} from "./interview-grading.service"
import {
    FlashcardDeckReadService,
} from "./flashcard-deck.service"
import {
    InterviewGradePromptService,
} from "./interview-grade-prompt.service"
import {
    CreditUsageService,
} from "../credit/credit-usage.service"
import {
    AiInvokeService,
    AiEntitlementService,
} from "@modules/ai"
import {
    AiMode,
    CreditUsageHistoryEntity,
    Locale,
} from "@modules/databases"
import {
    AiQuotaExhaustedException,
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    InterviewVerdict,
} from "./types/interview-grade"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("InterviewGradingService",
    () => {
        let module: TestingModule
        let service: InterviewGradingService
        let entityManager: EntityManagerMock
        let flashcardDeckReadService: {
            getById: jest.Mock
        }
        let aiInvokeService: {
            invoke: jest.Mock
        }
        let creditUsageService: {
            getSnapshot: jest.Mock
            invalidate: jest.Mock
        }

        const userId = "user-1"
        const flashcardDeckId = "deck-1"
        const flashcardCardId = "card-1"

        /** A gradable card (has a model answer) embedded in the deck the read returns. */
        const card = {
            id: flashcardCardId,
            question: "What is a database index?",
            answer: "A structure that speeds up lookups at the cost of write/space.",
            level: null,
        }

        /** Standard grade() params for the happy path (Auto lane). */
        const gradeParams = {
            userId,
            flashcardDeckId,
            flashcardCardId,
            transcript: "an index makes reads faster",
            locale: Locale.En,
            mode: AiMode.Auto,
        }

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            // the read returns the full deck with the question card embedded
            flashcardDeckReadService = {
                getById: jest.fn().mockResolvedValue({
                    id: flashcardDeckId,
                    cards: [card],
                }),
            }
            aiInvokeService = {
                invoke: jest.fn(),
            }
            // happy-path default: user is under quota
            creditUsageService = {
                getSnapshot: jest.fn().mockResolvedValue({
                    overQuota: false,
                }),
                invalidate: jest.fn(),
            }

            module = await Test.createTestingModule({
                providers: [
                    InterviewGradingService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: FlashcardDeckReadService,
                        useValue: flashcardDeckReadService,
                    },
                    {
                        // the prompt builder is pure and covered by its own concerns;
                        // here we only need it to return a messages envelope
                        provide: InterviewGradePromptService,
                        useValue: {
                            build: jest.fn(() => ({
                                messages: [],
                            })),
                        },
                    },
                    {
                        provide: AiInvokeService,
                        useValue: aiInvokeService,
                    },
                    {
                        // Auto lane never calls the entitlement resolver, so a bare stub is enough
                        provide: AiEntitlementService,
                        useValue: {
                        },
                    },
                    {
                        provide: CreditUsageService,
                        useValue: creditUsageService,
                    },
                ],
            }).compile()

            service = module.get<InterviewGradingService>(InterviewGradingService)
        })

        afterEach(async () => {
            await module.close()
        })

        it("blocks and never invokes / charges when the user is over the Auto credit quota",
            async () => {
                // over the shared rolling pool → the gate must short-circuit before any spend
                creditUsageService.getSnapshot.mockResolvedValueOnce({
                    overQuota: true,
                })

                await expect(
                    service.grade(gradeParams),
                ).rejects.toBeInstanceOf(AiQuotaExhaustedException)
                // no LLM call and no charge row when blocked
                expect(aiInvokeService.invoke).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("charges the Auto pool exactly once (no attempt) and busts the cache on a graded answer",
            async () => {
                aiInvokeService.invoke.mockResolvedValueOnce({
                    text: JSON.stringify({
                        score: 80,
                        verdict: "pass",
                        strengths: [],
                        gaps: [],
                        modelAnswerHint: null,
                        followUpQuestion: null,
                    }),
                })

                const result = await service.grade(gradeParams)

                expect(result.score).toBe(80)
                expect(result.verdict).toBe(InterviewVerdict.Pass)
                // exactly one Auto charge row, with no challenge attempt attached
                expect(entityManager.save).toHaveBeenCalledTimes(1)
                const [
                    entity,
                    row,
                ] = entityManager.save.mock.calls[0] as [
                    unknown,
                    {
                        mode: AiMode
                        attempt: unknown
                        user: {
                            id: string
                        }
                    },
                ]
                expect(entity).toBe(CreditUsageHistoryEntity)
                expect(row).toMatchObject({
                    mode: AiMode.Auto,
                    attempt: null,
                    user: {
                        id: userId,
                    },
                })
                // the cached usage is invalidated so the next gate sees this charge
                expect(creditUsageService.invalidate).toHaveBeenCalledWith(userId)
            })

        it("derives the verdict from the score when the model returns an unrecognized verdict literal",
            async () => {
                aiInvokeService.invoke.mockResolvedValueOnce({
                    text: JSON.stringify({
                        score: 82,
                        verdict: "strong",
                    }),
                })

                const result = await service.grade(gradeParams)

                // "strong" is not a valid literal → fall back to the score (>= 75 → pass)
                // instead of mislabeling a high-scoring answer as a fail
                expect(result.verdict).toBe(InterviewVerdict.Pass)
            })

        it("charges before parsing so a malformed model response cannot leak a free call",
            async () => {
                // unparseable output still consumed a real gpt-4o call → must be charged
                aiInvokeService.invoke.mockResolvedValueOnce({
                    text: "not json at all",
                })

                await expect(
                    service.grade(gradeParams),
                ).rejects.toBeInstanceOf(ParsingCriteriaResultsFromModelTextException)
                expect(entityManager.save).toHaveBeenCalledTimes(1)
            })
    })
