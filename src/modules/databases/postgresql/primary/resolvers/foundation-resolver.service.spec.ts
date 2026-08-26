import {
    Locale,
} from "../enums/locale"
import {
    FoundationResolverService,
} from "./foundation-resolver.service"

describe("FoundationResolverService",
    () => {
        it("applies translated fields, preserves empty author/tag values, and strips raw translations",
            () => {
                const resolve = jest.fn()
                    .mockReturnValueOnce("Translated title")
                    .mockReturnValueOnce("Translated description")
                    .mockReturnValueOnce("Valor")
                    .mockReturnValueOnce("")
                    .mockReturnValueOnce("")
                const service = new FoundationResolverService({
                    resolve
                } as never)
                const foundation = {
                    defaultLocale: Locale.En,
                    title: "old",
                    description: "old description",
                    value: "old value",
                    author: "original author",
                    translations: [],
                    tags: [{
                        defaultLocale: Locale.Vi, value: "original tag", translations: []
                    }],
                }

                service.transform(foundation as never,
                    Locale.Vi,
                    Locale.En)

                expect(foundation.title).toBe("Translated title")
                expect(foundation.author).toBe("original author")
                expect(foundation.tags?.[0].value).toBe("original tag")
                expect(foundation).not.toHaveProperty("translations")
                expect(foundation.tags?.[0]).not.toHaveProperty("translations")
            })
    })
