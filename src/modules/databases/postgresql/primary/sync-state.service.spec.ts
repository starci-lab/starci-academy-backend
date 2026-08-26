import {
    SyncStateService
} from "./sync-state.service"
import {
    SyncStateSourceType,
    SyncStateStatus,
    SyncStateTarget,
} from "./enums/sync-state"

describe("SyncStateService",
    () => {
        const input = {
            target: SyncStateTarget.Elasticsearch,
            sourceType: SyncStateSourceType.Content,
            sourceId: "id",
            sourceUpdatedAt: new Date("2026-01-02"),
        }
        it("creates missing state and skips an already-synced snapshot",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
                        sourceUpdatedAt: new Date("2026-01-02"), status: SyncStateStatus.Synced
                    }), save: jest.fn()
                }
                const service = new SyncStateService(manager as never)
                await expect(service.shouldSync(input)).resolves.toBe(true)
                await expect(service.shouldSync(input)).resolves.toBe(false)
                expect(manager.save).toHaveBeenCalledTimes(1)
            })
        it("marks failures with a retry message",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null), save: jest.fn()
                }
                await new SyncStateService(manager as never).markFailed({
                    ...input, error: new Error("failed")
                } as never)
                expect(manager.save).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        status: SyncStateStatus.Failed, retryCount: 1, lastError: "failed"
                    }))
            })

        it("does not resync a syncing state for an unchanged source timestamp",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        sourceUpdatedAt: new Date("2026-01-02"),
                        status: SyncStateStatus.Syncing,
                    }),
                    save: jest.fn(),
                }
                await expect(new SyncStateService(manager as never).shouldSync(input)).resolves.toBe(false)
                expect(manager.save).not.toHaveBeenCalled()
            })

        it("refreshes stale state and preserves the failure retry history",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        sourceUpdatedAt: new Date("2026-01-01"),
                        status: SyncStateStatus.Failed,
                        retryCount: 2,
                        lastError: "old",
                        nextRetryAt: new Date("2026-01-01"),
                    }),
                    save: jest.fn(),
                }
                await expect(new SyncStateService(manager as never).shouldSync(input)).resolves.toBe(true)
                expect(manager.save).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        status: SyncStateStatus.Syncing,
                        sourceUpdatedAt: input.sourceUpdatedAt,
                        lastError: null,
                        nextRetryAt: null,
                    }))
            })

        it("marks a missing state as synced and stringifies non-Error failures",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null),
                    save: jest.fn(),
                }
                const service = new SyncStateService(manager as never)
                await service.markSynced(input)
                await service.markFailed({
                    ...input,
                    error: {
                        code: "E_SYNC",
                    },
                } as never)

                expect(manager.save).toHaveBeenNthCalledWith(1,
                    expect.anything(),
                    expect.objectContaining({
                        status: SyncStateStatus.Synced,
                        retryCount: 0,
                    }))
                expect(manager.save).toHaveBeenNthCalledWith(2,
                    expect.anything(),
                    expect.objectContaining({
                        status: SyncStateStatus.Failed,
                        lastError: JSON.stringify({
                            code: "E_SYNC",
                        }),
                    }))
            })
    })
