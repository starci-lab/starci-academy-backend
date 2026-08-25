import path from "path"
import fs from "fs/promises"
import type {
    Dirent
} from "fs"
import {
    getEntityManagerToken
} from "@nestjs/typeorm"
import {
    Test
} from "@nestjs/testing"
import {
    COURSE_PARSER_FIXTURE_ROOT
} from "@tests/fixtures/course-parser/root"
import type {
    TestingModule
} from "@nestjs/testing"
import {
    ContentBodyEntity
} from "@modules/databases/postgresql/primary/entities/content-body.entity"
import {
    ContentEntity
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    Sha256Service
} from "@modules/crypto/sha256.service"
import {
    ContextLoaderService
} from "../../shared/contexts/loader.service"
import {
    CoerceMdScalarService
} from "../../shared/extracts/coerce-md-scalar.service"
import {
    ExtractJsonFromMdService
} from "../../shared/extracts/extract-json-from-md.service"
import {
    MergeJsonService
} from "../../shared/merge/merge.service"
import {
    PathResolverService
} from "../../shared/path/resolver.service"
import type {
    ResolvedFilePath
} from "../../shared/path/types"
import {
    ContentBodyIdFactoryService
} from "../id-factories/content-body.service"
import {
    ContentLearningOutcomeIdFactoryService
} from "../id-factories/content-learning-outcome.service"
import {
    ContentIdFactoryService
} from "../id-factories/content.service"
import {
    CourseIdFactoryService
} from "../id-factories/course.service"
import {
    ModuleIdFactoryService
} from "../id-factories/module.service"
import {
    WinstonService
} from "@modules/platform/winston/winston.service"
import {
    ContentPathService
} from "../path/content.service"
import {
    ContentParserService
} from "./content.service"

/** Fixture folder for the NestJS "frameworks in backend" lesson (SCHEMA V2 sample). */
const FRAMEWORKS_IN_BACKEND_FIXTURE_DIR = path.join(
    COURSE_PARSER_FIXTURE_ROOT,
    "0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend",
)

/** Relative path under the `courses` context root passed to {@link ContextLoaderService}. */
const FRAMEWORKS_IN_BACKEND_RELATIVE_PATH =
  "0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend"

/**
 * Lists indexed fixture folders (`{orderIndex}-{slug}`) under a courses-relative directory.
 *
 * @param relativeDir - Path under the repository-owned parser fixture.
 * @returns Resolved paths sorted by `orderIndex`.
 */
async function listIndexedFixtureDirs(
    relativeDir: string,
): Promise<Array<ResolvedFilePath>> {
    const absoluteDir = path.join(COURSE_PARSER_FIXTURE_ROOT,
        relativeDir)
    let entries: Array<Dirent>
    try {
        entries = await fs.readdir(absoluteDir,
            {
                withFileTypes: true,
            })
    } catch {
        return []
    }
    return entries
        .filter((entry) => entry.isDirectory() && /^\d+-/u.test(entry.name))
        .map((entry) => {
            const orderIndex = parseInt(entry.name.split("-")[0],
                10)
            const displayId = entry.name.substring(entry.name.indexOf("-") + 1)
            return {
                relativePath: `${relativeDir}/${entry.name}`.replace(/^\/+/u,
                    ""),
                orderIndex,
                displayId,
            }
        })
        .sort((prev, next) => prev.orderIndex - next.orderIndex)
}

describe("ContentParserService",
    () => {
        let module: TestingModule
        let service: ContentParserService
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let viMarkdown: string = ""
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let enMarkdown: string = ""

        beforeAll(async () => {
            viMarkdown = await fs.readFile(
                path.join(FRAMEWORKS_IN_BACKEND_FIXTURE_DIR,
                    "vi.md"),
                "utf8",
            )
            enMarkdown = await fs.readFile(
                path.join(FRAMEWORKS_IN_BACKEND_FIXTURE_DIR,
                    "en.md"),
                "utf8",
            )
        })

        beforeEach(async () => {
            const contextLoaderService = {
                load: jest.fn(
                    async (_baseDir: string, relativePath: string): Promise<string> =>
                        fs.readFile(
                            path.join(COURSE_PARSER_FIXTURE_ROOT,
                                relativePath),
                            "utf8",
                        ),
                ),
            }
            const pathResolverService = {
                filePaths: jest.fn(
                    async (
                        _baseDir: string,
                        relativePath: string,
                    ): Promise<Array<ResolvedFilePath>> =>
                        listIndexedFixtureDirs(relativePath),
                ),
                // real service reads `.e2e/<lang>/flow-*.md`; the fixture lesson has no `.e2e/`
                // folder, so mirror the real "absent directory" contract (`[]`) rather than stub blind.
                listRaw: jest.fn(
                    async (
                        _baseDir: string,
                        relativePath: string,
                    ): Promise<Array<string>> => {
                        try {
                            return await fs.readdir(
                                path.join(COURSE_PARSER_FIXTURE_ROOT,
                                    relativePath),
                            )
                        } catch {
                            return []
                        }
                    },
                ),
            }

            module = await Test.createTestingModule({
                providers: [
                    ContentParserService,
                    ExtractJsonFromMdService,
                    CoerceMdScalarService,
                    MergeJsonService,
                    Sha256Service,
                    CourseIdFactoryService,
                    ModuleIdFactoryService,
                    ContentIdFactoryService,
                    ContentBodyIdFactoryService,
                    ContentLearningOutcomeIdFactoryService,
                    {
                        provide: ContextLoaderService,
                        useValue: contextLoaderService,
                    },
                    {
                        provide: PathResolverService,
                        useValue: pathResolverService,
                    },
                    {
                        provide: ContentPathService,
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
                        provide: getEntityManagerToken("primary"),
                        useValue: {
                            find: jest.fn(),
                            findOne: jest.fn(),
                        },
                    },
                ],
            }).compile()

            service = module.get<ContentParserService>(ContentParserService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("parse",
            () => {
                it("parses 0-frameworks-in-backend vi.md + en.md and four language bodies",
                    async () => {
                        const parsed = await service.parse({
                            paths: [
                                {
                                    relativePath: FRAMEWORKS_IN_BACKEND_RELATIVE_PATH,
                                    orderIndex: 0,
                                    displayId: "frameworks-in-backend",
                                },
                            ],
                            courseIndex: 0,
                            moduleIndex: 0,
                            contentIndex: 0,
                        })

                        expect(parsed.displayId).toBe("frameworks-in-backend")
                        expect(parsed.orderIndex).toBe(0)
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        expect(parsed.title).toBe("What is a backend framework?")
                        expect(parsed.description).toBe(
                            "Understand the role of a backend framework: why it divides code into modules, why it instantiates and wires components for you, and what problem inversion of control solves. The lesson illustrates everything in parallel with TypeScript, Java, C#, and Go — pick your language.",
                        )
                        expect(parsed.body).toBe("")
                        expect(parsed.minutesRead).toBe(20)
                        expect(parsed.isPremium).toBe(false)
                        expect(parsed.verified).toEqual(new Date("2026-05-30"))
                        expect(parsed.bodies).toHaveLength(4)
                        expect(
                            parsed.bodies?.map((body: ContentBodyEntity) => body.lang),
                        ).toEqual(["typescript",
                            "java",
                            "csharp",
                            "go"])
                        const typescriptBody = parsed.bodies?.find(
                            (body) => body.lang === "typescript",
                        )
                        expect(typescriptBody?.orderIndex).toBe(0)
                        expect(typescriptBody?.body).toContain("## 1. Opening")
                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    contentId: parsed.id,
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Framework trong backend là gì?", // vn-ok: vi-locale seed fixture assertion
                                },
                                {
                                    contentId: parsed.id,
                                    locale: Locale.Vi,
                                    field: "description",
                                    value:
              "Hiểu vai trò của một backend framework: vì sao framework chia code thành module, vì sao nó tự khởi tạo và ghép nối các thành phần thay cho bạn, và inversion of control giải quyết vấn đề gì. Bài minh hoạ song song bằng TypeScript, Java, C# và Go — bạn chọn ngôn ngữ của mình.", // vn-ok: vi-locale seed fixture assertion
                                },
                                {
                                    contentId: parsed.id,
                                    locale: Locale.En,
                                    field: "title",
                                    value: "What is a backend framework?",
                                },
                                {
                                    contentId: parsed.id,
                                    locale: Locale.En,
                                    field: "description",
                                    value: parsed.description,
                                },
                            ]),
                        )
                        expect(parsed.translations).toHaveLength(4)
                    })

                it("throws when the requested content ordinal is not mounted",
                    async () => {
                        await expect(
                            service.parse({
                                paths: [],
                                courseIndex: 0,
                                moduleIndex: 0,
                                contentIndex: 9,
                            }),
                        ).rejects.toMatchObject({
                            code: "CONTENT_PATH_NOT_FOUND_EXCEPTION"
                        })
                    })
            })

        it("skips content parse failures and logs the mounted path",
            async () => {
                const pathService = module.get(ContentPathService)
                jest
                    .mocked(pathService.paths)
                    .mockResolvedValue([
                        {
                            relativePath: "missing", orderIndex: 1, displayId: "missing"
                        },
                    ])
                const result = await service.parseMany({
                    moduleRelativePath: "module",
                    courseIndex: 0,
                    moduleIndex: 0,
                })
                expect(result).toEqual([])
                expect(module.get(WinstonService).log).toHaveBeenCalled()
            })

        it("loads persisted contents by deterministic module id",
            async () => {
                const rows = [{
                    id: "content-1"
                }] as never
                const manager = module.get(getEntityManagerToken("primary"))
                jest.mocked(manager.find).mockResolvedValue(rows)
                await expect(
                    service.contentsFromDatabase({
                        courseIndex: 2, moduleIndex: 3
                    }),
                ).resolves.toBe(rows)
                expect(manager.find).toHaveBeenCalledWith(ContentEntity,
                    expect.anything())
            })
    })
