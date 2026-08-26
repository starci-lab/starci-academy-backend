import {
    BlogSeederService
} from "./blog-seeder.service"
import {
    BlogCategory,
} from "@modules/databases/postgresql/primary/enums/blog-category"
describe("BlogSeederService",
    () => { it("honors the disabled seeder gate",
        async () => { const paths = jest.fn(); const service = new BlogSeederService({
        } as never,
{
    isBlogSeederEnabled: jest.fn().mockReturnValue(false)
} as never,
{
    filePaths: paths
} as never,
{
} as never,
{
} as never,
{
} as never); await expect(service.seed()).resolves.toBeUndefined(); expect(paths).not.toHaveBeenCalled() })
    it("does not load content when the enabled blog mount is empty",
        async () => { const paths = jest.fn().mockResolvedValue([]); const loader = jest.fn(); const service = new BlogSeederService({
        } as never,
{
    isBlogSeederEnabled: jest.fn().mockReturnValue(true)
} as never,
{
    filePaths: paths
} as never,
{
    load: loader
} as never,
{
} as never,
{
} as never); await expect(service.seed()).resolves.toBeUndefined(); expect(paths).toHaveBeenCalledWith("blog",
            ""); expect(loader).not.toHaveBeenCalled() })

    it("upserts a single-language post with paired required fields and defaults",
        async () => {
            const upsert = jest.fn().mockResolvedValue(undefined)
            const service = new BlogSeederService({
                upsert
            } as never,
{
    isBlogSeederEnabled: jest.fn().mockReturnValue(true),
} as never,
{
    filePaths: jest.fn().mockResolvedValue([{
        relativePath: "2-release-notes",
        displayId: "release-notes",
    }]),
} as never,
{
    load: jest.fn().mockResolvedValue("markdown"),
} as never,
{
    extract: jest.fn().mockReturnValue({
        title: "Release notes",
        body: "Highlights",
    }),
} as never,
{
    toNullableEnum: jest.fn().mockReturnValue(undefined),
    toNullableStringColumn: jest.fn().mockReturnValue(null),
    toNullableNumericColumn: jest.fn().mockReturnValue(null),
    toNullableDate: jest.fn().mockReturnValue(null),
    toRequiredBoolean: jest.fn().mockReturnValue(false),
} as never)

            await service.seed()
            expect(upsert).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    slug: "release-notes",
                    title: {
                        en: "Release notes", vi: "Release notes"
                    },
                    body: {
                        en: "Highlights", vi: "Highlights"
                    },
                    category: BlogCategory.DeepDive,
                    excerpt: null,
                    ctaLabel: null,
                }),
                ["slug"],
            )
        })

    it("falls back to Vietnamese metadata and required fields when English is absent",
        async () => {
            const upsert = jest.fn().mockResolvedValue(undefined)
            const service = new BlogSeederService(
                {
                    upsert
                } as never,
                {
                    isBlogSeederEnabled: jest.fn().mockReturnValue(true)
                } as never,
                {
                    filePaths: jest.fn().mockResolvedValue([{
                        relativePath: "3-vietnamese-post",
                        displayId: "vietnamese-post",
                    }])
                } as never,
                {
                    load: jest.fn()
                        .mockRejectedValueOnce(new Error("no en"))
                        .mockResolvedValueOnce("vi markdown")
                } as never,
                {
                    extract: jest.fn().mockReturnValue({
                        title: "Vietnamese title",
                        body: "Vietnamese body",
                        category: BlogCategory.Career,
                        isPublished: false,
                    })
                } as never,
                {
                    toNullableEnum: jest.fn().mockReturnValue(BlogCategory.Career),
                    toNullableStringColumn: jest.fn().mockReturnValue(null),
                    toNullableNumericColumn: jest.fn().mockReturnValue(null),
                    toNullableDate: jest.fn().mockReturnValue(null),
                    toRequiredBoolean: jest.fn((value: unknown, fallback: boolean) => value ?? fallback),
                } as never,
            )

            await service.seed()

            expect(upsert).toHaveBeenCalledWith(expect.anything(),
                expect.objectContaining({
                    slug: "vietnamese-post",
                    title: {
                        en: "Vietnamese title", vi: "Vietnamese title"
                    },
                    body: {
                        en: "Vietnamese body", vi: "Vietnamese body"
                    },
                    category: BlogCategory.Career,
                    isPublished: false,
                }),
                ["slug"])
        })

    it("skips folders with no usable language fields",
        async () => {
            const upsert = jest.fn()
            const service = new BlogSeederService(
            {
                upsert
            } as never,
            {
                isBlogSeederEnabled: jest.fn().mockReturnValue(true)
            } as never,
            {
                filePaths: jest.fn().mockResolvedValue([
                    {
                        relativePath: "empty", displayId: "empty"
                    },
                    {
                        relativePath: "metadata-only", displayId: "metadata-only"
                    },
                ])
            } as never,
            {
                load: jest.fn()
                    .mockResolvedValueOnce("")
                    .mockResolvedValueOnce(null)
                    .mockResolvedValue("markdown")
            } as never,
            {
                extract: jest.fn().mockReturnValue({
                    category: BlogCategory.Career
                })
            } as never,
            {
            } as never,
            )

            await service.seed()

            expect(upsert).not.toHaveBeenCalled()
        })

    it("does not read markdown when the seeder is disabled",
        async () => {
            const load = jest.fn()
            const service = new BlogSeederService(
                {
                    upsert: jest.fn(),
                } as never,
                {
                    isBlogSeederEnabled: jest.fn().mockReturnValue(false),
                } as never,
                {
                    filePaths: jest.fn(),
                } as never,
                {
                    load,
                } as never,
                {
                } as never,
                {
                } as never,
            )

            await service.seed()

            expect(load).not.toHaveBeenCalled()
        })

    it("pairs trimmed bilingual values and returns null only when both sides are empty",
        () => {
            const service = new BlogSeederService({
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
            } as never)
            const internals = service as unknown as {
                pair: (en: string | undefined, vi: string | undefined) => { en: string; vi: string } | null
                pairNullable: (en: string | undefined, vi: string | undefined) => { en: string; vi: string } | null
            }

            expect(internals.pair("  English ",
                undefined)).toEqual({
                en: "English",
                vi: "English",
            })
            expect(internals.pair(undefined,
                " Vietnamese ")).toEqual({
                en: "Vietnamese",
                vi: "Vietnamese",
            })
            expect(internals.pair(" ",
                undefined)).toBeNull()
            expect(internals.pairNullable("English",
                "Tiếng Việt")).toEqual({
                en: "English",
                vi: "Tiếng Việt",
            })
        })
    })
