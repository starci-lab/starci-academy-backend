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
    GradingLaneValidationService,
} from "@modules/ai"
import {
    UserService,
} from "../user"
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
            run: jest.Mock
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
                run: jest.fn(),
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
                        // Auto pick (no model) validates to the default Auto lane; the
                        // service then maps it to an Auto job selection (no pinned model).
                        provide: GradingLaneValidationService,
                        useValue: {
                            validate: jest.fn().mockResolvedValue({
                                mode: AiMode.Auto,
                            }),
                        },
                    },
                    {
                        provide: CreditUsageService,
                        useValue: creditUsageService,
                    },
                    {
                        // best-effort attempt recording resolves a trial enrollment; a
                        // bare stub keeps the (try/catch-wrapped) history write inert
                        provide: UserService,
                        useValue: {
                            resolveOrCreateTrialEnrollment: jest.fn()
                                .mockResolvedValue(null),
                        },
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
                expect(aiInvokeService.run).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("charges the Auto pool exactly once (no attempt) and busts the cache on a graded answer",
            async () => {
                aiInvokeService.run.mockResolvedValueOnce({
                    text: JSON.stringify({
                        score: 80,
                        verdict: "pass",
                        strengths: [],
                        gaps: [],
                        modelAnswerHint: null,
                        followUpQuestion: null,
                    }),
                    // Auto served the free pinned model → zero credits
                    model: "gpt-4o",
                    provider: undefined,
                    cost: 0,
                })

                const result = await service.grade(gradeParams)

                expect(result.score).toBe(80)
                expect(result.verdict).toBe(InterviewVerdict.Pass)
                // exactly one Auto charge row, with no challenge attempt attached
                // (the interview-history attempt is a separate, best-effort save)
                const creditSaveCalls = (
                    entityManager.save.mock.calls as Array<[unknown, unknown]>
                ).filter(
                    ([entity]) => entity === CreditUsageHistoryEntity,
                )
                expect(creditSaveCalls).toHaveLength(1)
                const [
                    ,
                    row,
                ] = creditSaveCalls[0] as [
                    unknown,
                    {
                        mode: AiMode
                        attempt: unknown
                        user: {
                            id: string
                        }
                    },
                ]
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
                aiInvokeService.run.mockResolvedValueOnce({
                    text: JSON.stringify({
                        score: 82,
                        verdict: "strong",
                    }),
                    model: "gpt-4o",
                    provider: undefined,
                    cost: 0,
                })

                const result = await service.grade(gradeParams)

                // "strong" is not a valid literal → fall back to the score (>= 75 → pass)
                // instead of mislabeling a high-scoring answer as a fail
                expect(result.verdict).toBe(InterviewVerdict.Pass)
            })

        it("charges before parsing so a malformed model response cannot leak a free call",
            async () => {
                // unparseable output still consumed a real gpt-4o call → must be charged
                aiInvokeService.run.mockResolvedValueOnce({
                    text: "not json at all",
                    model: "gpt-4o",
                    provider: undefined,
                    cost: 0,
                })

                await expect(
                    service.grade(gradeParams),
                ).rejects.toBeInstanceOf(ParsingCriteriaResultsFromModelTextException)
                expect(entityManager.save).toHaveBeenCalledTimes(1)
            })
    })
