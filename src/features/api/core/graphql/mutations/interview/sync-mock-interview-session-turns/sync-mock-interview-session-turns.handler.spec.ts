import {
    SyncMockInterviewSessionTurnsCommand,
} from "./sync-mock-interview-session-turns.command"
import {
    SyncMockInterviewSessionTurnsHandler,
} from "./sync-mock-interview-session-turns.handler"
import {
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"

describe("SyncMockInterviewSessionTurnsHandler",
    () => {
        it("silently declines a missing or completed session",
            async () => {
                const findOne = jest.fn().mockResolvedValue({
                    id: "session-1",
                    status: "completed",
                })
                const update = jest.fn()
                const handler = new SyncMockInterviewSessionTurnsHandler({
                    findOne,
                    update,
                } as never)

                await expect(handler.execute(new SyncMockInterviewSessionTurnsCommand({
                    request: {
                        sessionId: "session-1",
                        turns: [],
                        questionIndex: 2,
                        phaseIndex: 1,
                    },
                    user: {
                        id: "user-1",
                    } as never,
                }))).resolves.toEqual({
                    success: false,
                })
                expect(update).not.toHaveBeenCalled()
            })

        it("normalizes artifact hints and persists an in-progress transcript",
            async () => {
                const update = jest.fn().mockResolvedValue(undefined)
                const handler = new SyncMockInterviewSessionTurnsHandler({
                    findOne: jest.fn().mockResolvedValue({
                        id: "session-1",
                        status: "in_progress",
                    }),
                    update,
                } as never)

                await expect(handler.execute(new SyncMockInterviewSessionTurnsCommand({
                    request: {
                        sessionId: "session-1",
                        turns: [{
                            role: "assistant",
                            phase: MockInterviewPhase.DeepDive,
                            content: "Use a map",
                            questionIndex: 0,
                            artifactHint: "code",
                        },
                        {
                            role: "user",
                            phase: MockInterviewPhase.DeepDive,
                            content: "I would use hashing",
                            questionIndex: 0,
                            artifactHint: "text",
                        }],
                        questionIndex: 1,
                        phaseIndex: 0,
                    },
                    user: {
                        id: "user-1",
                    } as never,
                }))).resolves.toEqual({
                    success: true,
                })
                expect(update).toHaveBeenCalledWith(expect.anything(),
                    {
                        id: "session-1",
                    },
                    {
                        turns: [{
                            role: "assistant",
                            phase: MockInterviewPhase.DeepDive,
                            content: "Use a map",
                            questionIndex: 0,
                            artifactHint: "code",
                        },
                        {
                            role: "user",
                            phase: MockInterviewPhase.DeepDive,
                            content: "I would use hashing",
                            questionIndex: 0,
                            artifactHint: undefined,
                        }],
                        questionIndex: 1,
                        phaseIndex: 0,
                    })
            })
    })
