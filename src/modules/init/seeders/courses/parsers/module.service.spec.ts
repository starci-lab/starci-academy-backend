import path from "path"
import fs from "fs/promises"
import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    COURSE_PARSER_FIXTURE_ROOT,
} from "@tests/fixtures/course-parser/root"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CourseContentTier,
} from "@modules/databases/postgresql/primary/enums/course-content-tier"
import {
    Sha256Service,
} from "@modules/crypto/sha256.service"
import {
    ContextLoaderService,
} from "../../shared/contexts/loader.service"
import {
    CoerceMdScalarService,
} from "../../shared/extracts/coerce-md-scalar.service"
import {
    ExtractJsonFromMdService,
} from "../../shared/extracts/extract-json-from-md.service"
import {
    MergeJsonService,
} from "../../shared/merge/merge.service"
import {
    ContentIdFactoryService,
} from "../id-factories/content.service"
import {
    CourseIdFactoryService,
} from "../id-factories/course.service"
import {
    ModuleIdFactoryService,
} from "../id-factories/module.service"
import {
    PreviewContentIdFactoryService,
} from "../id-factories/preview-content.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ModulePathService,
} from "../path/module.service"
import {
    ModuleParserService,
} from "./module.service"

/** Relative path under the `courses` context root for the M0 module readme. */
const NESTJS_CORE_RELATIVE_PATH =
    "0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle"

describe("ModuleParserService",
    () => {
        let module: TestingModule
        let service: ModuleParserService

        beforeEach(async () => {
            const contextLoaderService = {
                load: jest.fn(
                    async (
                        _baseDir: string,
                        relativePath: string,
                    ): Promise<string> => fs.readFile(
                        path.join(
                            COURSE_PARSER_FIXTURE_ROOT,
                            relativePath,
                        ),
                        "utf8",
                    ),
                ),
            }

            module = await Test.createTestingModule({
                providers: [
                    ModuleParserService,
                    ExtractJsonFromMdService,
                    CoerceMdScalarService,
                    MergeJsonService,
                    Sha256Service,
                    CourseIdFactoryService,
                    ModuleIdFactoryService,
                    ContentIdFactoryService,
                    PreviewContentIdFactoryService,
                    {
                        provide: ContextLoaderService,
                        useValue: contextLoaderService,
                    },
                    {
                        provide: ModulePathService,
                        useValue: {
                            paths: jest.fn(),
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                            error: jest.fn(),
                            warn: jest.fn(),
                        },
                    },
                    {
                        // parse() never touches the DB, but the parser injects the primary
                        // entity manager (used by modulesFromDatabase) -> DI needs it
                        provide: getEntityManagerToken("primary"),
                        useValue: makeEntityManagerMock(),
                    },
                ],
            }).compile()

            service = module.get<ModuleParserService>(ModuleParserService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("parse",
            () => {
                it(
                    "parses the M0 nestjs-core module readme en.md + vi.md",
                    async () => {
                        const parsed = await service.parse({
                            paths: [
                                {
                                    relativePath: NESTJS_CORE_RELATIVE_PATH,
                                    orderIndex: 0,
                                    displayId: "nestjs-core-and-request-lifecycle",
                                },
                            ],
                            moduleIndex: 0,
                            courseIndex: 0,
                        })

                        expect(parsed.displayId).toBe("nestjs-core-and-request-lifecycle")
                        expect(parsed.orderIndex).toBe(0)
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        expect(parsed.title).toBe(
                            "Backend foundations: Frameworks, request lifecycle, configuration and logging",
                        )

                        expect(parsed.previewContents).toHaveLength(5)
                        expect(typeof parsed.previewContents?.[0]?.text).toBe("string")
                        expect(parsed.previewContents?.[0]?.text?.length ?? 0).toBeGreaterThan(0)
                        expect(parsed.previewContents?.[0]?.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "text",
                                }),
                            ]),
                        )

                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "title",
                                    value:
                                        "Nền tảng backend: Framework, vòng đời request, cấu hình và logging", // vn-ok: vi-locale seed fixture assertion
                                }),
                            ]),
                        )
                    },
                )

                it("applies safe scalar defaults and maps preview translations",
                    async () => {
                        const find = jest.fn().mockResolvedValue([])
                        const service = new ModuleParserService(
                            {
                                extract: jest.fn().mockReturnValue({
                                }),
                            } as never,
                            {
                                generate: jest.fn().mockReturnValue("preview-id"),
                            } as never,
                            {
                                generate: jest.fn().mockReturnValue("module-id"),
                            } as never,
                            {
                                load: jest.fn().mockResolvedValue("markdown"),
                            } as never,
                            {
                                generate: jest.fn().mockReturnValue("course-id"),
                            } as never,
                            {
                            } as never,
                            {
                                merge: jest.fn().mockReturnValue({
                                    title: "Module",
                                    description: "Description",
                                    sortIndex: "invalid",
                                    isPremium: "not-boolean",
                                    contentType: "unknown",
                                    previewContents: [{
                                        orderIndex: 0,
                                        text: "Preview",
                                        translations: [{
                                            locale: Locale.Vi,
                                            field: "text",
                                            value: "Xem trước", // vn-ok: vi-locale parser fixture assertion
                                        }],
                                    }],
                                    translations: [],
                                }),
                            } as never,
                            {
                                log: jest.fn(),
                            } as never,
                            {
                                find,
                            } as never,
                        )

                        const result = await service.parse({
                            paths: [{
                                relativePath: "course/modules/3-module",
                                orderIndex: 3,
                                displayId: "module",
                            }],
                            moduleIndex: 3,
                            courseIndex: 2,
                        })

                        expect(result.sortIndex).toBe(4)
                        expect(result.isPremium).toBe(false)
                        expect(result.contentTier).toBe(CourseContentTier.Foundation)
                        expect(result.previewContents?.[0]).toEqual(expect.objectContaining({
                            id: "preview-id",
                            module: {
                                id: "module-id",
                            },
                            translations: [{
                                previewContentId: "preview-id",
                                locale: Locale.Vi,
                                field: "text",
                                value: "Xem trước", // vn-ok: vi-locale parser fixture assertion
                            }],
                        }))
                        await expect(service.modulesFromDatabase({
                            courseIndex: 2,
                        })).resolves.toEqual([])
                        expect(find).toHaveBeenCalled()
                    })

                it("uses safe defaults and empty nested rows for a blank merged module",
                    async () => {
                        const merge = module.get(MergeJsonService)
                        jest.spyOn(merge,
                            "merge").mockReturnValue({
                            } as never)

                        const result = await service.parse({
                            paths: [{
                                relativePath: NESTJS_CORE_RELATIVE_PATH,
                                orderIndex: 0,
                                displayId: "nestjs-core",
                            }],
                            moduleIndex: 0,
                            courseIndex: 0,
                        })

                        expect(result.title).toBe("")
                        expect(result.description).toBe("")
                        expect(result.sortIndex).toBe(1)
                        expect(result.isPremium).toBe(false)
                        expect(result.previewContents).toEqual([])
                        expect(result.translations).toEqual([])
                    })

                it("maps sparse preview rows and preserves their translated text",
                    async () => {
                        const merge = module.get(MergeJsonService)
                        jest.spyOn(merge,
                            "merge").mockReturnValue({
                                previewContents: [{
                                },
                                {
                                    orderIndex: 2,
                                    text: "Preview",
                                    translations: [{
                                        locale: Locale.Vi,
                                        field: "text",
                                        value: "Xem truoc",
                                    }],
                                }],
                                translations: [],
                            } as never)

                        const result = await service.parse({
                            paths: [{
                                relativePath: NESTJS_CORE_RELATIVE_PATH,
                                orderIndex: 0,
                                displayId: "nestjs-core",
                            }],
                            moduleIndex: 0,
                            courseIndex: 0,
                        })

                        expect(result.previewContents).toHaveLength(2)
                        expect(result.previewContents?.[0]?.text).toBe("")
                        expect(result.previewContents?.[1]?.translations).toEqual([{
                            previewContentId: expect.any(String),
                            locale: Locale.Vi,
                            field: "text",
                            value: "Xem truoc",
                        }])
                    })

                it("keeps successful modules while logging an isolated parse failure",
                    async () => {
                        const pathService = module.get(ModulePathService)
                        const winston = module.get(WinstonService)
                        jest.mocked(pathService.paths).mockResolvedValue([
                            {
                                relativePath: "course/0-good",
                                orderIndex: 0,
                                displayId: "good",
                            },
                            {
                                relativePath: "course/1-bad",
                                orderIndex: 1,
                                displayId: "bad",
                            },
                        ])
                        jest.spyOn(service,
                            "parse")
                            .mockResolvedValueOnce({
                                id: "module-0"
                            } as never)
                            .mockRejectedValueOnce(new Error("invalid module"))

                        await expect(service.parseMany({
                            courseRelativePath: "course",
                            courseIndex: 0,
                        })).resolves.toEqual([
                            expect.objectContaining({
                                index: 0,
                                relativePath: "course/0-good",
                            }),
                        ])
                        expect(winston.log).toHaveBeenCalledTimes(1)
                    })

                it("rejects a module index when no matching path exists",
                    async () => {
                        await expect(service.parse({
                            paths: [{
                                relativePath: "course/0-only",
                                orderIndex: 0,
                                displayId: "only",
                            }],
                            moduleIndex: 4,
                            courseIndex: 0,
                        })).rejects.toThrow()
                    })
            },
        )

        it("coerces module premium and content tier values with safe defaults",
            () => {
                const parser = service as unknown as {
                    toBoolean: (value: unknown) => boolean
                    toContentTier: (value: unknown) => CourseContentTier
                }
                expect(parser.toBoolean(true)).toBe(true)
                expect(parser.toBoolean(" TRUE ")).toBe(true)
                expect(parser.toBoolean("false")).toBe(false)
                expect(parser.toBoolean(undefined)).toBe(false)
                expect(parser.toContentTier(" ADVANCED ")).toBe(CourseContentTier.Advanced)
                expect(parser.toContentTier("unrecognised")).toBe(CourseContentTier.Foundation)
                expect(parser.toContentTier(null)).toBe(CourseContentTier.Foundation)
            })
    },
)
