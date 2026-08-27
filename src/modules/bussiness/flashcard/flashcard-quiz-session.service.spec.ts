import {
    GraphQLError,
} from "graphql"
import {
    FlashcardQuizSessionService
} from "./flashcard-quiz-session.service"
import type {
    ClozeQuizItemSnapshot, ClozeQuizSelection
} from "./cloze/cloze-contract"

const item: ClozeQuizItemSnapshot = {
    cardId: "card-1",
    question: "Fill it",
    clozeText: "{{blank:card-1:c1:o1}} {{blank:card-1:c1:o2}}",
    blanks: [
        {
            blankId: "card-1:c1:o1"
        },
        {
            blankId: "card-1:c1:o2"
        },
    ],
    tokens: [
        {
            tokenId: "00000000-0000-4000-8000-000000000001", label: "same"
        },
        {
            tokenId: "00000000-0000-4000-8000-000000000002", label: "same"
        },
    ],
    answerKey: {
        "card-1:c1:o1": "00000000-0000-4000-8000-000000000001",
        "card-1:c1:o2": "00000000-0000-4000-8000-000000000002",
    },
}

describe("FlashcardQuizSessionService v1 cloze authority",
    () => {
        const makeService = (entityManager: Record<string, jest.Mock> = {
        }) => new FlashcardQuizSessionService(
            entityManager as never,
            {
                getStats: jest.fn().mockResolvedValue({
                    retentionRate: 50
                })
            } as never,
            {
                searchCourse: jest.fn().mockResolvedValue({
                    hits: []
                })
            } as never,
        )

        it("grades exact opaque token identity, not duplicate visible labels",
            () => {
                const service = makeService() as unknown as {
                    grade: (items: Array<ClozeQuizItemSnapshot>, selections: Array<ClozeQuizSelection>) => {
                        correctBlanks: number
                        totalBlanks: number
                    }
                }
                const result = service.grade([item],
                    [
                        {
                            blankId: "card-1:c1:o1", tokenId: "00000000-0000-4000-8000-000000000002"
                        },
                        {
                            blankId: "card-1:c1:o2", tokenId: "00000000-0000-4000-8000-000000000001"
                        },
                    ])
                expect(result).toMatchObject({
                    correctBlanks: 0, totalBlanks: 2
                })
            })

        it("rejects a token assigned to more than one blank",
            () => {
                const service = makeService() as unknown as {
                    validateSelections: (items: Array<ClozeQuizItemSnapshot>, selections: Array<ClozeQuizSelection>) => unknown
                }
                expect(() => service.validateSelections([item],
                    [
                        {
                            blankId: "card-1:c1:o1", tokenId: item.tokens[0].tokenId
                        },
                        {
                            blankId: "card-1:c1:o2", tokenId: item.tokens[0].tokenId
                        },
                    ])).toThrow(GraphQLError)
            })

        it("locks, replaces progress, and increments answerVersion once",
            async () => {
                const session = {
                    id: "session-1",
                    contractVersion: 1,
                    quizItems: [item],
                    answerState: [],
                    answerVersion: 0,
                    currentIndex: 0,
                    status: "in_progress",
                    enrollment: {
                        courseId: "course-1"
                    },
                }
                const manager = {
                    findOne: jest.fn().mockResolvedValue(session),
                    save: jest.fn(async (value) => value),
                }
                const root = {
                    transaction: jest.fn(async (work) => work(manager)),
                }
                const result = await makeService(root).sync({
                    userId: "user-1",
                    sessionId: "session-1",
                    currentIndex: 0,
                    expectedVersion: 0,
                    selections: [{
                        blankId: item.blanks[0].blankId, tokenId: item.tokens[0].tokenId
                    }],
                })
                expect(manager.findOne).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        lock: {
                            mode: "pessimistic_write"
                        },
                    }))
                expect(result.answerVersion).toBe(1)
            })

        it("rejects a stale non-idempotent progress write",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        id: "session-1",
                        contractVersion: 1,
                        quizItems: [item],
                        answerState: [],
                        answerVersion: 2,
                        currentIndex: 0,
                        status: "in_progress",
                    }),
                }
                const root = {
                    transaction: jest.fn(async (work) => work(manager))
                }
                await expect(makeService(root).sync({
                    userId: "user-1",
                    sessionId: "session-1",
                    currentIndex: 0,
                    expectedVersion: 0,
                    selections: [],
                })).rejects.toBeInstanceOf(GraphQLError)
            })
    })
