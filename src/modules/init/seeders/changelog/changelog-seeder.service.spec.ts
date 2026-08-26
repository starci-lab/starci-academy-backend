jest.mock("node:fs",
    () => {
        const actual = jest.requireActual("node:fs") as typeof import("node:fs")
        return {
            ...actual,
            existsSync: jest.fn(),
            readFileSync: jest.fn(),
        }
    })

jest.mock("@modules/filesystem/utils/mount-seed",
    () => ({
        getRuntimeContextRoot: jest.fn().mockReturnValue("/runtime-seed"),
    }))

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn().mockReturnValue({
            mountPath: {
                data: {
                    changelog: "/fallback-seed",
                },
            },
        }),
    }))

import {
    existsSync,
    readFileSync,
} from "node:fs"
import {
    ChangelogSeederService
} from "./changelog-seeder.service"

describe("ChangelogSeederService",
    () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("honors the disabled seeder gate",
            async () => {
                const upsert = jest.fn()
                const service = new ChangelogSeederService({
                    upsert
                } as never,
{
    isChangelogSeederEnabled: jest.fn().mockReturnValue(false)
} as never,
{
} as never,
{
} as never)
                await expect(service.seed()).resolves.toBeUndefined()
                expect(upsert).not.toHaveBeenCalled()
            })

        it("upserts parsed entries with coerced fields and fallback publication date",
            async () => {
                const upsert = jest.fn().mockResolvedValue(undefined)
                const service = new ChangelogSeederService(
                    {
                        upsert,
                    } as never,
                    {
                        isChangelogSeederEnabled: jest.fn().mockReturnValue(true),
                    } as never,
                    {
                        extract: jest.fn().mockReturnValue({
                            data: [{
                                slug: "release-1",
                                title: {
                                    en: "Release",
                                },
                                category: "feature",
                                body: undefined,
                                publishedAt: undefined,
                                linkUrl: "https://example.test/release",
                                isPublished: undefined,
                            }],
                        }),
                    } as never,
                    {
                        toRequiredString: jest.fn().mockReturnValue("release-1"),
                        toNullableEnum: jest.fn().mockReturnValue("feature"),
                        toNullableDate: jest.fn().mockReturnValue(null),
                        toNullableStringColumn: jest.fn().mockReturnValue(
                            "https://example.test/release",
                        ),
                        toRequiredBoolean: jest.fn().mockReturnValue(true),
                    } as never,
                )
                ;(existsSync as jest.Mock).mockReturnValue(true)
                ;(readFileSync as jest.Mock).mockReturnValue("markdown")

                await service.seed()

                expect(readFileSync).toHaveBeenCalledWith(
                    expect.stringContaining("runtime-seed"),
                    "utf8",
                )
                expect(upsert).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        slug: "release-1",
                        body: null,
                        category: "feature",
                        linkUrl: "https://example.test/release",
                        isPublished: true,
                    }),
                    ["slug"],
                )
                const payload = upsert.mock.calls[0]?.[1] as { publishedAt: Date }
                expect(payload.publishedAt).toBeInstanceOf(Date)
            })

        it("returns without reading or writing when no changelog file exists",
            async () => {
                const upsert = jest.fn()
                const service = new ChangelogSeederService(
                    {
                        upsert,
                    } as never,
                    {
                        isChangelogSeederEnabled: jest.fn().mockReturnValue(true),
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )
                ;(existsSync as jest.Mock).mockReturnValue(false)

                await service.seed()

                expect(readFileSync).not.toHaveBeenCalled()
                expect(upsert).not.toHaveBeenCalled()
            })
    })
