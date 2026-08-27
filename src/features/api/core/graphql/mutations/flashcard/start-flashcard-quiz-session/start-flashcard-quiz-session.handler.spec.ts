import {
    StartFlashcardQuizSessionHandler
} from "./start-flashcard-quiz-session.handler"
import {
    StartFlashcardQuizSessionCommand
} from "./start-flashcard-quiz-session.command"
import {
    ClozeParserService
} from "@modules/bussiness/flashcard/cloze/cloze-parser.service"

describe("StartFlashcardQuizSessionHandler",
    () => {
        it("snapshots eligible cards and never exposes the hidden answer key",
            async () => {
                let persisted: Record<string, unknown> | null = null
                const manager = {
                    findOneOrFail: jest.fn().mockResolvedValue({
                        id: "enrollment-1"
                    }),
                    findOne: jest.fn(async () => persisted),
                    query: jest.fn().mockResolvedValue([{
                        id: "card-1",
                        question: "Dependency injection",
                        answer: "Use {{c1::constructor injection::DI}}.",
                    }]),
                    update: jest.fn(),
                    save: jest.fn(async (_entity, value) => {
                        persisted = {
                            ...value,
                            id: "session-1",
                            createdAt: new Date("2026-08-27T00:00:00.000Z"),
                        }
                        return persisted
                    }),
                }
                const entityManager = {
                    transaction: jest.fn(async (work) => work(manager))
                }
                const handler = new StartFlashcardQuizSessionHandler(
                    entityManager as never,
                    {
                        resolveOrCreateTrialEnrollment: jest.fn().mockResolvedValue({
                            id: "enrollment-1"
                        })
                    } as never,
                    new ClozeParserService(),
                ) as unknown as { process: (command: StartFlashcardQuizSessionCommand) => Promise<Record<string, unknown>> }
                const command = new StartFlashcardQuizSessionCommand({
                    request: {
                        courseId: "00000000-0000-4000-8000-000000000010",
                        requestedItemCount: 1,
                        startRequestId: "00000000-0000-4000-8000-000000000011",
                    },
                    user: {
                        id: "user-1"
                    } as never,
                })
                const result = await handler.process(command)
                expect(result).toMatchObject({
                    sessionId: "session-1", contractVersion: 1, answerVersion: 0
                })
                expect((result.items as Array<Record<string, unknown>>)[0]).not.toHaveProperty("answerKey")
                expect((persisted!.quizItems as Array<Record<string, unknown>>)[0]).toHaveProperty("answerKey")
            })
    })
