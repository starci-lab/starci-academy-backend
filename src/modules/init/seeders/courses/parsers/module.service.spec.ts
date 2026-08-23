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
            },
        )
    },
)
