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

    it("expands MinIO object keys and keeps a missing thumbnail nullable",
        async () => {
            const buildPublicObjectUrl = jest.fn().mockReturnValue("https://minio.test/assets/a.png")
            const service = new FoundationCategoryParserService(
                {
                    extract: jest.fn().mockReturnValue({
                        title: "Category",
                        thumbnailUrl: "///assets/a.png",
                        sortIndex: 4,
                    }),
                } as never,
                {
                    toNullableStringColumn: jest.fn((value: unknown) =>
                        typeof value === "string" ? value : null),
                } as never,
                {
                } as never,
                {
                    load: jest.fn().mockResolvedValue("markdown")
                } as never,
                {
                    generate: jest.fn().mockReturnValue("category-id")
                } as never,
                {
                } as never,
                {
                    buildPublicObjectUrl
                } as never,
            )

            const result = await service.parse({
                paths: [{
                    relativePath: "0-category",
                    orderIndex: 0,
                    displayId: "category",
                }],
                categoryIndex: 0,
            })

            expect(result.thumbnailUrl).toBe("https://minio.test/assets/a.png")
            expect(buildPublicObjectUrl).toHaveBeenCalledWith({
                key: "assets/a.png",
                provider: "minio",
            })

            const noThumbnail = new FoundationCategoryParserService(
                {
                    extract: jest.fn().mockReturnValue({
                        title: "Category"
                    }),
                } as never,
                {
                    toNullableStringColumn: jest.fn(() => null),
                } as never,
                {
                } as never,
                {
                    load: jest.fn().mockResolvedValue("markdown")
                } as never,
                {
                    generate: jest.fn().mockReturnValue("category-id")
                } as never,
                {
                } as never,
                {
                    buildPublicObjectUrl: jest.fn()
                } as never,
            )
            await expect(noThumbnail.parse({
                paths: [{
                    relativePath: "0-category",
                    orderIndex: 0,
                    displayId: "category",
                }],
                categoryIndex: 0,
            })).resolves.toEqual(expect.objectContaining({
                thumbnailUrl: null
            }))
        })

    it("retains valid categories when a sibling category cannot be parsed",
        async () => {
            const parse = jest.fn()
                .mockResolvedValueOnce({
                    id: "category-0"
                })
                .mockRejectedValueOnce(new Error("invalid category"))
            const log = jest.fn()
            const service = new FoundationCategoryParserService(
                {
                } as never,
                {
                } as never,
                {
                    paths: jest.fn().mockResolvedValue([
                        {
                            relativePath: "0-good", orderIndex: 0, displayId: "good"
                        },
                        {
                            relativePath: "1-bad", orderIndex: 1, displayId: "bad"
                        },
                    ]),
                } as never,
                {
                } as never,
                {
                } as never,
                {
                    log
                } as never,
                {
                } as never,
            )
            jest.spyOn(service,
                "parse").mockImplementation(parse)

            await expect(service.parseMany()).resolves.toEqual([
                expect.objectContaining({
                    index: 0,
                    relativePath: "0-good",
                }),
            ])
            expect(log).toHaveBeenCalledTimes(1)
        })

    it("rejects a category index when no matching folder is available",
        async () => {
            const service = new FoundationCategoryParserService(
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
                {
                } as never,
            )

            await expect(service.parse({
                paths: [{
                    relativePath: "0-only",
                    orderIndex: 0,
                    displayId: "only",
                }],
                categoryIndex: 2,
            })).rejects.toThrow(FoundationCategoryPathNotFoundException)
        })
    })
