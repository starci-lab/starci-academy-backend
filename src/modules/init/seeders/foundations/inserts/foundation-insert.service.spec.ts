import {
    FoundationInsertService
} from "./foundation-insert.service"
describe("FoundationInsertService",
    () => {
        it("upserts foundation, translations, tags, and tag translations",
            async () => {
                const upsert = {
                    upsertMany: jest.fn().mockResolvedValue(undefined), upsertTranslationMany: jest.fn().mockResolvedValue(undefined)
                }
                const service = new FoundationInsertService(upsert as never)
                await service.insert({
                    id: "f", category: {
                        id: "cat"
                    }, translations: [{
                        locale: "en"
                    }], tags: [{
                        id: "t", translations: [{
                            locale: "en"
                        }]
                    }]
                } as never)
                expect(upsert.upsertMany).toHaveBeenCalledTimes(2)
                expect(upsert.upsertTranslationMany).toHaveBeenCalledTimes(2)
            })
        it("applies category scope when deleting stale rows",
            async () => {
                const upsert = {
                    upsertMany: jest.fn().mockResolvedValue(undefined)
                }
                await new FoundationInsertService(upsert as never).deleteStale(["f1",
                    "f2"],
                "cat")
                expect(upsert.upsertMany).toHaveBeenCalledWith(expect.any(Function),
                    [{
                        id: "f1"
                    },
                    {
                        id: "f2"
                    }],
                    {
                        category: {
                            id: "cat"
                        }
                    })
            })
    })
