import {
    FoundationTagIdFactoryService,
} from "./foundation-tag.service"

describe("FoundationTagIdFactoryService",
    () => {
        it("chains the parent foundation id and tag ordinal into a UUID",
            () => {
                const hash = jest.fn().mockReturnValue("tag-hash")
                const foundation = jest.fn().mockReturnValue("foundation-id")
                const service = new FoundationTagIdFactoryService(
                    {
                        hash,
                    } as never,
                    {
                        generate: foundation,
                    } as never,
                )

                const result = service.generate({
                    categoryIndex: 1,
                    foundationIndex: 3,
                    tagIndex: 4,
                })

                expect(result).toMatch(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                )
                expect(foundation).toHaveBeenCalledWith({
                    categoryIndex: 1,
                    foundationIndex: 3,
                })
                expect(hash).toHaveBeenCalledWith(
                    "foundation-tag",
                    "foundation-id",
                    "4",
                )
            })
    })
