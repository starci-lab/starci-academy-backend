import {
    FoundationParserService
} from "./foundation.service"
import {
    FoundationKind,
} from "@modules/databases/postgresql/primary/enums/foundation-kind"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
describe("FoundationParserService",
    () => { it("skips missing paths in parseMany",
        async () => { const service = new FoundationParserService({
            extract: jest.fn()
        } as never,
{
} as never,
{
    paths: jest.fn().mockResolvedValue([])
} as never,
{
} as never,
{
} as never,
{
} as never,
{
} as never,
{
    log: jest.fn()
} as never); await expect(service.parseMany({
            categoryRelativePath: "1-category", categoryIndex: 1
        })).resolves.toEqual([]) })

    it("parses localized metadata, defaults invalid scalars, and creates translations",
        async () => {
            const extract = jest.fn().mockReturnValue({
                title: "HTTP",
                description: "Basics",
                kind: "not-a-kind",
                isRecommended: "true",
            })
            const service = new FoundationParserService({
                extract
            } as never,
{
    toNullableStringColumn: jest.fn((value: unknown) => value ?? null),
    toRequiredString: jest.fn((value: unknown, fallback: string) =>
        typeof value === "string" ? value : fallback),
    toRequiredBoolean: jest.fn((value: unknown, fallback: boolean) =>
        typeof value === "boolean" ? value : fallback),
} as never,
{
    paths: jest.fn(),
} as never,
{
    load: jest.fn().mockResolvedValue("markdown"),
} as never,
{
    generate: jest.fn().mockReturnValue("foundation-id"),
} as never,
{
    generate: jest.fn().mockReturnValue("category-id"),
} as never,
{
    parse: jest.fn().mockReturnValue([]),
} as never,
{
    log: jest.fn()
} as never)

            const result = await service.parse({
                paths: [{
                    relativePath: "1-http", orderIndex: 1, displayId: "http"
                }],
                foundationIndex: 1,
                categoryIndex: 2,
            })
            expect(result.id).toBe("foundation-id")
            expect(result.category).toEqual({
                id: "category-id"
            })
            expect(result.kind).toBe(FoundationKind.Document)
            expect(result.orderIndex).toBe(1)
            expect(result.sortIndex).toBe(2)
            expect(result.translations).toHaveLength(Object.values(Locale).length * 4)
        })
    })
