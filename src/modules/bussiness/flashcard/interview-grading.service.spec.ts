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
    AiEntitlementService,
    AiInvokeService,
    GradingLaneValidationService,
} from "@modules/ai"
import {
    UserService,
} from "../user"
import {
    AiCeilSurface,
    AiMode,
    AiModelTask,
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
        let aiEntitlementService: {
            assertNotOverQuota: jest.Mock
            consume: jest.Mock
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
            // happy-path default: user is under quota (unified pool); consume()
            // is the SINGLE place that debits + records the history row now
            aiEntitlementService = {
                assertNotOverQuota: jest.fn().mockResolvedValue(undefined),
                consume: jest.fn().mockResolvedValue(undefined),
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
                        provide: AiEntitlementService,
                        useValue: aiEntitlementService,
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

        it("blocks and never invokes / charges when the user is over the unified credit quota",
            async () => {
                // over the shared unified pool → the gate must short-circuit before any spend
                aiEntitlementService.assertNotOverQuota.mockRejectedValueOnce(
                    new AiQuotaExhaustedException({
                        mode: AiMode.Auto,
                        window: "5h",
                    }),
                )

                await expect(
                    service.grade(gradeParams),
                ).rejects.toBeInstanceOf(AiQuotaExhaustedException)
                // no LLM call and no charge when blocked
                expect(aiInvokeService.run).not.toHaveBeenCalled()
                expect(aiEntitlementService.consume).not.toHaveBeenCalled()
            })

        it("charges the resolved lane exactly once via the SAME unified consume() everything else uses",
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
                    promptTokens: 120,
                    completionTokens: 40,
                    attempts: 1,
                })

                const result = await service.grade(gradeParams)

                expect(result.score).toBe(80)
                expect(result.verdict).toBe(InterviewVerdict.Pass)
                // consume() debits + records the history row atomically — no manual
                // entityManager write in this service anymore
                expect(aiEntitlementService.consume).toHaveBeenCalledTimes(1)
                expect(aiEntitlementService.consume).toHaveBeenCalledWith({
                    userId,
                    mode: AiMode.Auto,
                    cost: 0,
                    surface: AiCeilSurface.Interview,
                    task: AiModelTask.Grading,
                    model: "gpt-4o",
                    provider: undefined,
                    promptTokens: 120,
                    completionTokens: 40,
                    attempts: 1,
                })
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
                // charged BEFORE the parse failure — a malformed response still consumed
                // a real model call and must not leak a free grading run
                expect(aiEntitlementService.consume).toHaveBeenCalledTimes(1)
            })
    })
