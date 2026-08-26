import {
    ChangelogEntriesResolver
} from "./changelog-entries.resolver"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"

describe("ChangelogEntriesResolver",
    () => {
        it("clamps limits and resolves localized optional body",
            async () => {
                const find = jest.fn().mockResolvedValue([{
                    id: "c1", title: {
                        en: "Title", vi: "Localized"
                    }, body: null, category: "feature", publishedAt: new Date(), linkUrl: null
                }])
                const resolver = new ChangelogEntriesResolver({
                    find
                } as never)
                await expect(resolver.execute(Locale.Vi,
                    99)).resolves.toEqual([{
                    id: "c1", title: "Localized", body: null, category: "feature", publishedAt: expect.any(Date), linkUrl: null
                }])
                expect(find).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        take: 20
                    }))
            })
    })
