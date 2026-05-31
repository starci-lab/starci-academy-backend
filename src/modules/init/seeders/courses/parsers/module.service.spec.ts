import path from "path"
import fs from "fs/promises"
import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
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
} from "../../shared"
import {
    CourseIdFactoryService,
    ModuleIdFactoryService,
    PreviewContentIdFactoryService,
    ContentIdFactoryService,
} from "../id-factories"
import {
    WinstonService,
} from "@modules/winston"
import {
    ModulePathService,
} from "../path"
import {
    ModuleParserService,
} from "./module.service"

const COURSES_MOUNT_ROOT = path.join(
    process.cwd(),
    ".mount/data/courses",
)

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
                            COURSES_MOUNT_ROOT,
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

                        expect(parsed.previewContents).toHaveLength(4)
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
                                        "Nền tảng backend: Framework, vòng đời request, cấu hình và logging",
                                }),
                            ]),
                        )
                    },
                )
            },
        )
    },
)
