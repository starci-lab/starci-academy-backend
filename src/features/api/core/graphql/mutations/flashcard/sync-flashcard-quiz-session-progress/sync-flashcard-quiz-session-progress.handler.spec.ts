import {
    SyncFlashcardQuizSessionProgressCommand
} from "./sync-flashcard-quiz-session-progress.command"
import {
    SyncFlashcardQuizSessionProgressHandler
} from "./sync-flashcard-quiz-session-progress.handler"

describe("SyncFlashcardQuizSessionProgressHandler",
    () => {
        it("binds the authenticated learner and versioned selections",
            async () => {
                const sync = jest.fn().mockResolvedValue({
                    answerVersion: 2
                })
                const handler = new SyncFlashcardQuizSessionProgressHandler({
                    sync
                } as never) as unknown as {
                    process: (command: SyncFlashcardQuizSessionProgressCommand) => Promise<unknown>
                }
                const request = {
                    sessionId: "00000000-0000-4000-8000-000000000001",
                    currentIndex: 1,
                    expectedVersion: 1,
                    selections: [],
                }
                await handler.process(new SyncFlashcardQuizSessionProgressCommand({
                    request,
                    user: {
                        id: "user-1"
                    } as never,
                }))
                expect(sync).toHaveBeenCalledWith({
                    userId: "user-1", ...request
                })
            })
    })
