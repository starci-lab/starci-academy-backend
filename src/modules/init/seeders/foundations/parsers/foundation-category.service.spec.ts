import {
    FoundationCategoryParserService
} from "./foundation-category.service"
import {
    FoundationCategoryPathNotFoundException
} from "@modules/platform/exceptions/errors/courses/foundation-category-path-not-found"
describe("FoundationCategoryParserService",
    () => { it("rejects an unknown category path",
        async () => { const service = new FoundationCategoryParserService({
            extract: jest.fn()
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
} as never,
{
} as never); await expect(service.parse({
            paths: [], categoryIndex: 9
        })).rejects.toThrow(FoundationCategoryPathNotFoundException) })

    it("keeps absolute thumbnails and falls back for missing scalar values",
        async () => {
            const service = new FoundationCategoryParserService({
                extract: jest.fn((markdownPath: string) => markdownPath.endsWith("/en.md")
                    ? {
                        title: "English", thumbnailUrl: "https://cdn.test/a.png", sortIndex: "not-a-number"
                    }
                    : {
                        title: "Tiếng Việt"
                    }),
            } as never,
{
    toNullableStringColumn: jest.fn((value: unknown) => typeof value === "string" ? value : null),
} as never,
{
} as never,
{
    load: jest.fn((_mount: string,
        relativePath: string) => Promise.resolve(relativePath)),
} as never,
{
    generate: jest.fn().mockReturnValue("category-1")
} as never,
{
} as never,
{
    buildPublicObjectUrl: jest.fn(),
} as never)

            const result = await service.parse({
                paths: [{
                    relativePath: "1-category", orderIndex: 1, displayId: "category"
                }],
                categoryIndex: 1,
            })

            expect(result.thumbnailUrl).toBe("https://cdn.test/a.png")
            expect(result.sortIndex).toBe(2)
        })
    })
