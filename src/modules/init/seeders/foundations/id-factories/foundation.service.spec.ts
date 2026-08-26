import {
    FoundationIdFactoryService,
} from "./foundation.service"

describe("FoundationIdFactoryService",
    () => {
        it("chains the category id and foundation ordinal into a deterministic UUID",
            () => {
                const hash = jest.fn().mockReturnValue("foundation-hash")
                const category = jest.fn().mockReturnValue("category-id")
                const service = new FoundationIdFactoryService(
                    {
                        hash,
                    } as never,
                    {
                        generate: category,
                    } as never,
                )

                const first = service.generate({
                    categoryIndex: 2,
                    foundationIndex: 7,
                })
                const second = service.generate({
                    categoryIndex: 2,
                    foundationIndex: 7,
                })

                expect(first).toBe(second)
                expect(first).toMatch(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                )
                expect(category).toHaveBeenCalledWith({
                    categoryIndex: 2,
                })
                expect(hash).toHaveBeenNthCalledWith(1,
                    "foundation",
                    "category-id",
                    "7",
                )
            })
    })
