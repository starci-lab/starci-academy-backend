import {
    CodingProblemInsertService
} from "./coding-problem-insert.service"

describe("CodingProblemInsertService",
    () => {
        it("returns zero and leaves the manager untouched for an empty parse",
            async () => {
                const transaction = jest.fn()
                const service = new CodingProblemInsertService({
                    transaction
                } as never)
                await expect(service.upsertMany([])).resolves.toBe(0)
                expect(transaction).not.toHaveBeenCalled()
            })
    })
