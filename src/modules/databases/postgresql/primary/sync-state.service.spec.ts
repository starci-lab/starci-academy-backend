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
    })
