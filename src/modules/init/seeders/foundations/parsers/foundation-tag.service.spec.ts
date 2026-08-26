import {
    FoundationTagParserService
} from "./foundation-tag.service"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"

describe("FoundationTagParserService",
    () => {
        it("returns no rows when English tags are absent",
            () => {
                const service = new FoundationTagParserService({
                    toRequiredString: jest.fn()
                } as never,
{
    generate: jest.fn()
} as never)
                expect(service.parse({
                    jsonMap: new Map([[Locale.En,
                        {
                        }]]), categoryIndex: 1, foundationIndex: 2, foundationId: "f1"
                })).toEqual([])
            })

        it("creates deterministic tag rows and locale translations",
            () => {
                const service = new FoundationTagParserService({
                    toRequiredString: jest.fn((value: unknown, fallback: string) => typeof value === "string" ? value : fallback),
                } as never,
{
    generate: jest.fn().mockReturnValue("tag-1")
} as never)
                const result = service.parse({
                    jsonMap: new Map([
                        [Locale.En,
                            {
                                tags: [{
                                    orderIndex: 0, value: " HTTP "
                                }]
                            }],
                        [Locale.Vi,
                            {
                                tags: [{
                                    orderIndex: 0, value: " HTTP localized "
                                }]
                            }],
                    ]) as never, categoryIndex: 1, foundationIndex: 2, foundationId: "f1",
                })
                expect(result[0]).toEqual(expect.objectContaining({
                    id: "tag-1", value: "HTTP", sortIndex: 0
                }))
                expect(result[0].translations).toHaveLength(2)
            })
    })
