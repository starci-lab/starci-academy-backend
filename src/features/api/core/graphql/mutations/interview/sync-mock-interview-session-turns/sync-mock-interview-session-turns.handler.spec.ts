import {
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"
import {
    SyncMockInterviewSessionTurnsCommand,
} from "./sync-mock-interview-session-turns.command"
import {
    SyncMockInterviewSessionTurnsHandler,
} from "./sync-mock-interview-session-turns.handler"

/** Builds the fluent update query used by optimistic sync. */
const updateQuery = (affected = 1) => ({
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({
        affected
    }),
})

describe("SyncMockInterviewSessionTurnsHandler",
    () => {
        it("returns the authoritative state when a completed session declines a late sync",
            async () => {
                const handler = new SyncMockInterviewSessionTurnsHandler({
                    findOne: jest.fn().mockResolvedValue({
                        id: "session-1",
                        status: "completed",
                        revision: 4,
                        turns: [],
                        questionIndex: 2,
                        phaseIndex: 1,
                    }),
                } as never)

                await expect(handler.execute(new SyncMockInterviewSessionTurnsCommand({
                    request: {
                        sessionId: "session-1",
                        expectedRevision: 3,
                        turns: [],
                        questionIndex: 2,
                        phaseIndex: 1,
                    },
                    user: {
                        id: "user-1"
                    } as never,
                }))).resolves.toEqual({
                    success: false,
                    conflict: false,
                    revision: 4,
                    turns: [],
                    questionIndex: 2,
                    phaseIndex: 1,
                })
            })

        it("normalizes artifact hints and increments the optimistic revision",
            async () => {
                const query = updateQuery()
                const handler = new SyncMockInterviewSessionTurnsHandler({
                    findOne: jest.fn().mockResolvedValue({
                        id: "session-1",
                        status: "in_progress",
                        revision: 7,
                        turns: [],
                        questionIndex: 0,
                        phaseIndex: 0,
                        expiresAt: new Date(Date.now() + 60_000),
                    }),
                    createQueryBuilder: jest.fn(() => query),
                } as never)
                const turns = [{
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
                }]

                await expect(handler.execute(new SyncMockInterviewSessionTurnsCommand({
                    request: {
                        sessionId: "session-1",
                        expectedRevision: 7,
                        turns,
                        questionIndex: 1,
                        phaseIndex: 0,
                    },
                    user: {
                        id: "user-1"
                    } as never,
                }))).resolves.toMatchObject({
                    success: true,
                    conflict: false,
                    revision: 8,
                    questionIndex: 1,
                    phaseIndex: 0,
                    turns: [{
                        artifactHint: "code"
                    },
                    {
                        artifactHint: undefined
                    }],
                })
                expect(query.execute).toHaveBeenCalledTimes(1)
            })

        it("rejects a stale revision with the server snapshot",
            async () => {
                const serverTurns = [{
                    role: "candidate",
                    phase: MockInterviewPhase.Requirements,
                    content: "server answer",
                }]
                const handler = new SyncMockInterviewSessionTurnsHandler({
                    findOne: jest.fn().mockResolvedValue({
                        id: "session-1",
                        status: "in_progress",
                        revision: 3,
                        turns: serverTurns,
                        questionIndex: 1,
                        phaseIndex: 0,
                        expiresAt: new Date(Date.now() + 60_000),
                    }),
                } as never)

                await expect(handler.execute(new SyncMockInterviewSessionTurnsCommand({
                    request: {
                        sessionId: "session-1",
                        expectedRevision: 2,
                        turns: [],
                        questionIndex: 0,
                        phaseIndex: 0,
                    },
                    user: {
                        id: "user-1"
                    } as never,
                }))).resolves.toEqual({
                    success: false,
                    conflict: true,
                    revision: 3,
                    turns: serverTurns,
                    questionIndex: 1,
                    phaseIndex: 0,
                })
            })
    })
