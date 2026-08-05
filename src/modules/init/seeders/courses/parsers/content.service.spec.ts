import path from "path"
import fs from "fs/promises"
import type {
    Dirent,
} from "fs"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    ContentBodyEntity,
    Locale,
} from "@modules/databases"
import {
    Sha256Service,
} from "@modules/crypto"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    MergeJsonService,
    ContextLoaderService,
    PathResolverService,
} from "../../shared"
import type {
    ResolvedFilePath,
} from "../../shared"
import {
    ContentIdFactoryService,
    ContentBodyIdFactoryService,
    ContentLearningOutcomeIdFactoryService,
    CourseIdFactoryService,
    ModuleIdFactoryService,
} from "../id-factories"
import {
    WinstonService,
} from "@modules/winston"
import {
    ContentPathService,
} from "../path"
import {
    ContentLegacyParserService,
} from "./content-legacy.service"
import {
    ContentParserService,
} from "./content.service"

const COURSES_MOUNT_ROOT = path.join(
    process.cwd(),
    ".mount/data/courses",
)

/** Mount folder for the NestJS "frameworks in backend" lesson (SCHEMA V2 sample). */
const FRAMEWORKS_IN_BACKEND_MOUNT_DIR = path.join(
    COURSES_MOUNT_ROOT,
    "0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend",
)

/** Relative path under the `courses` context root passed to {@link ContextLoaderService}. */
const FRAMEWORKS_IN_BACKEND_RELATIVE_PATH =
    "0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend"

/**
 * Lists indexed mount folders (`{orderIndex}-{slug}`) under a courses-relative directory.
 *
 * @param relativeDir - Path under `.mount/data/courses/`.
 * @returns Resolved paths sorted by `orderIndex`.
 */
async function listIndexedMountDirs(
    relativeDir: string,
): Promise<Array<ResolvedFilePath>> {
    const absoluteDir = path.join(
        COURSES_MOUNT_ROOT,
        relativeDir,
    )
    let entries: Array<Dirent>
    try {
        entries = await fs.readdir(
            absoluteDir,
            {
                withFileTypes: true,
            },
        )
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
                path.join(
                    FRAMEWORKS_IN_BACKEND_MOUNT_DIR,
                    "vi.md",
                ),
                "utf8",
            )
            enMarkdown = await fs.readFile(
                path.join(
                    FRAMEWORKS_IN_BACKEND_MOUNT_DIR,
                    "en.md",
                ),
                "utf8",
            )
        })

        beforeEach(async () => {
            const contextLoaderService = {
                load: jest.fn(
                    async (
                        _baseDir: string,
                        relativePath: string,
                    ): Promise<string> => fs.readFile(
                        path.join(
                            COURSES_MOUNT_ROOT,
                            relativePath,
                        ),
                        "utf8",
                    ),
                ),
            }
            const pathResolverService = {
                filePaths: jest.fn(
                    async (
                        _baseDir: string,
                        relativePath: string,
                    ): Promise<Array<ResolvedFilePath>> => listIndexedMountDirs(relativePath),
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
                                path.join(
                                    COURSES_MOUNT_ROOT,
                                    relativePath,
                                ),
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
                        provide: ContentLegacyParserService,
                        useValue: {
                            parse: jest.fn(),
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
                it(
                    "parses 0-frameworks-in-backend vi.md + en.md and four language bodies",
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
                        expect(parsed.bodies?.map((body: ContentBodyEntity) => body.lang)).toEqual([
                            "typescript",
                            "java",
                            "csharp",
                            "go",
                        ])
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
                                    value: "Hiểu vai trò của một backend framework: vì sao framework chia code thành module, vì sao nó tự khởi tạo và ghép nối các thành phần thay cho bạn, và inversion of control giải quyết vấn đề gì. Bài minh hoạ song song bằng TypeScript, Java, C# và Go — bạn chọn ngôn ngữ của mình.", // vn-ok: vi-locale seed fixture assertion
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
                    },
                )
            },
        )
    },
)
