import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
import {
    MOCK_INTERVIEW_SESSION_DURATION_MS
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    StartMockInterviewSessionCommand
} from "./start-mock-interview-session.command"
import {
    StartMockInterviewSessionHandler
} from "./start-mock-interview-session.handler"

describe("StartMockInterviewSessionHandler",
    () => {
        const request = {
            courseId: "course-1",
            level: "senior",
            mode: "design",
            lang: "typescript",
            langs: ["typescript",
                "go"],
            questionCount: 5,
            kinds: ["scenario"],
            countsToReadiness: false,
            name: "Architecture round",
        }

        it("draws with the authenticated user and maps seed defaults and deadline",
            async () => {
                const createdAt = new Date("2026-02-01T12:00:00.000Z")
                const draw = jest.fn().mockResolvedValue({
                    sessionId: "session-1",
                    promptId: "prompt-1",
                    promptTitle: "Design a queue",
                    difficulty: "hard",
                    source: "capstone",
                    level: "senior",
                    mode: "design",
                    seedTopics: [
                        {
                            cardId: "card-1",
                            kind: "scenario",
                            title: "Queue",
                            givenCodes: undefined,
                        },
                        {
                            cardId: "card-2",
                            kind: "theory",
                            title: "Cache",
                            givenCodes: [{
                                lang: "typescript",
                                code: "const value = 1",
                            }],
                        },
                    ],
                    createdAt,
                })
                const handler = new StartMockInterviewSessionHandler({
                    draw
                } as never)
                const command = new StartMockInterviewSessionCommand({
                    request,
                    user: {
                        id: "user-1",
                    } as never,
                    locale: Locale.Vi,
                })

                await expect(handler.execute(command)).resolves.toEqual({
                    sessionId: "session-1",
                    promptId: "prompt-1",
                    promptTitle: "Design a queue",
                    difficulty: "hard",
                    source: "capstone",
                    level: "senior",
                    mode: "design",
                    seedTopics: [
                        {
                            cardId: "card-1",
                            kind: "scenario",
                            title: "Queue",
                            givenCodes: [],
                        },
                        {
                            cardId: "card-2",
                            kind: "theory",
                            title: "Cache",
                            givenCodes: [{
                                lang: "typescript",
                                code: "const value = 1",
                            }],
                        },
                    ],
                    deadlineAt: new Date(createdAt.getTime() + MOCK_INTERVIEW_SESSION_DURATION_MS).toISOString(),
                })
                expect(draw).toHaveBeenCalledWith({
                    userId: "user-1",
                    ...request,
                    locale: Locale.Vi,
                })
            })

        it("defaults the locale to English and rejects anonymous commands",
            async () => {
                const draw = jest.fn()
                const handler = new StartMockInterviewSessionHandler({
                    draw
                } as never)
                const command = new StartMockInterviewSessionCommand({
                    request,
                    user: undefined,
                })

                await expect(handler.execute(command)).rejects.toBeInstanceOf(UserNotFoundException)
                expect(draw).not.toHaveBeenCalled()

                draw.mockResolvedValueOnce({
                    sessionId: "session-2",
                    promptId: "prompt-2",
                    promptTitle: "Q&A",
                    difficulty: "medium",
                    source: "flashcard",
                    level: "middle",
                    mode: "qna",
                    seedTopics: [],
                    createdAt: new Date("2026-02-02T00:00:00.000Z"),
                })
                await handler.execute(new StartMockInterviewSessionCommand({
                    request,
                    user: {
                        id: "user-2",
                    } as never,
                }))
                expect(draw).toHaveBeenCalledWith(expect.objectContaining({
                    locale: Locale.En,
                }))
            })

        it("propagates draw failures",
            async () => {
                const failure = new Error("draw unavailable")
                const draw = jest.fn().mockRejectedValue(failure)
                const handler = new StartMockInterviewSessionHandler({
                    draw
                } as never)

                await expect(handler.execute(new StartMockInterviewSessionCommand({
                    request,
                    user: {
                        id: "user-3",
                    } as never,
                    locale: Locale.En,
                }))).rejects.toBe(failure)
            })
    })
