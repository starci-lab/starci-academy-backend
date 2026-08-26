import {
    FoundationParserService
} from "./foundation.service"
import {
    FoundationKind,
} from "@modules/databases/postgresql/primary/enums/foundation-kind"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    FoundationPathNotFoundException,
} from "@modules/platform/exceptions/errors/courses/foundation-path-not-found"
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
            const toSortIndex = (service as unknown as {
                toSortIndex: (value: unknown, fallback: number) => number
            }).toSortIndex.bind(service)
            expect(toSortIndex("7",
                2)).toBe(7)
            expect(toSortIndex(undefined,
                2)).toBe(3)
        })

    it("throws when the requested foundation is not discovered",
        async () => {
            const service = new FoundationParserService({
                extract: jest.fn()
            } as never,
            {
            } as never,
            {
                paths: jest.fn()
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
            } as never)
            await expect(service.parse({
                paths: [],
                foundationIndex: 2,
                categoryIndex: 1,
            })).rejects.toBeInstanceOf(FoundationPathNotFoundException)
        })

    it("uses the fallback order when sortIndex is non-finite numeric input",
        () => {
            const service = new FoundationParserService(
                {
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
                } as never,
                {
                } as never,
                {
                    log: jest.fn(),
                } as never,
            )
            const toSortIndex = (service as unknown as {
                toSortIndex: (value: unknown, fallback: number) => number
            }).toSortIndex.bind(service)

            expect(toSortIndex(Number.POSITIVE_INFINITY,
                3)).toBe(4)
            expect(toSortIndex(5,
                3)).toBe(5)
        })
    it("builds a safe default graph when localized metadata is empty",
        async () => {
            const service = new FoundationParserService(
                {
                    extract: jest.fn().mockReturnValue({
                    }),
                } as never,
                {
                    toNullableStringColumn: jest.fn().mockReturnValue(null),
                    toRequiredString: jest.fn().mockReturnValue(FoundationKind.Document),
                    toRequiredBoolean: jest.fn().mockReturnValue(false),
                } as never,
                {
                } as never,
                {
                    load: jest.fn().mockResolvedValue("markdown"),
                } as never,
                {
                    generate: jest.fn().mockReturnValue("foundation-empty"),
                } as never,
                {
                    generate: jest.fn().mockReturnValue("category-empty"),
                } as never,
                {
                    parse: jest.fn().mockReturnValue([]),
                } as never,
                {
                    log: jest.fn(),
                } as never,
            )

            const result = await service.parse({
                paths: [{
                    relativePath: "empty",
                    orderIndex: 0,
                    displayId: "empty",
                }],
                foundationIndex: 0,
                categoryIndex: 0,
            })

            expect(result).toEqual(expect.objectContaining({
                id: "foundation-empty",
                displayId: "empty",
                title: "",
                description: null,
                kind: FoundationKind.Document,
                isRecommended: false,
                sortIndex: 1,
            }))
            expect(result.translations).toEqual(expect.arrayContaining([{
                foundationId: "foundation-empty",
                locale: Locale.En,
                field: "title",
                value: "",
            }]))
        })
    })
