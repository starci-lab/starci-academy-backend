import {
    AiModelInsertService
} from "./ai-model-insert.service"

describe("AiModelInsertService",
    () => {
        it("does not query or retire anything for an empty seed",
            async () => {
                const find = jest.fn()
                const service = new AiModelInsertService({
                    find
                } as never)
                await expect(service.upsertMany([])).resolves.toBe(0)
                expect(find).not.toHaveBeenCalled()
            })
    })
