import {
    CodingProblemHintIndexService,
} from "./coding-problem-hint-index.service"

describe("CodingProblemHintIndexService",
    () => {
        it("ensures locale indexes and indexes only non-empty localized hints",
            async () => {
                const exists = jest.fn().mockResolvedValue(true)
                const index = jest.fn().mockResolvedValue(undefined)
                const service = new CodingProblemHintIndexService({
                    client: {
                        indices: {
                            exists,
                            create: jest.fn(),
                        },
                        index,
                    },
                } as never)

                const count = await service.indexMany([{
                    slug: "two-sum",
                    hints: {
                        en: "Use a map",
                        vi: "",
                    },
                }] as never)

                expect(count).toBe(1)
                expect(exists).toHaveBeenCalled()
                expect(index).toHaveBeenCalledWith(expect.objectContaining({
                    id: "two-sum",
                    body: {
                        slug: "two-sum",
                        hint: "Use a map",
                    },
                }))
            })

        it("creates a missing index and tolerates an already-created race",
            async () => {
                const create = jest.fn().mockRejectedValue(new Error("already exists"))
                const service = new CodingProblemHintIndexService({
                    client: {
                        indices: {
                            exists: jest.fn().mockResolvedValue(false),
                            create,
                        },
                        index: jest.fn(),
                    },
                } as never)

                await expect(service.indexMany([])).resolves.toBe(0)
                expect(create).toHaveBeenCalled()
            })
    })
