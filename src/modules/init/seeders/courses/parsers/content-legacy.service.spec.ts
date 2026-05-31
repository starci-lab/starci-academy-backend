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
    ContentIdFactoryService,
    ContentReferenceIdFactoryService,
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

const COURSES_MOUNT_ROOT = path.join(
    process.cwd(),
    ".mount/data/courses",
)

/** Relative path to the legacy (V1) M0 L1 lesson `request-response-lifecycle`. */
const LIFECYCLE_RELATIVE_PATH =
    "0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/1-request-response-lifecycle"

describe("ContentLegacyParserService",
    () => {
        let module: TestingModule
        let service: ContentLegacyParserService

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
                    ContentLegacyParserService,
                    ExtractJsonFromMdService,
                    CoerceMdScalarService,
                    MergeJsonService,
                    Sha256Service,
                    CourseIdFactoryService,
                    ModuleIdFactoryService,
                    ContentIdFactoryService,
                    ContentReferenceIdFactoryService,
                    {
                        provide: ContextLoaderService,
                        useValue: contextLoaderService,
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
                ],
            }).compile()

            service = module.get<ContentLegacyParserService>(ContentLegacyParserService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("parse",
            () => {
                it(
                    "parses the legacy 1-request-response-lifecycle lesson vi.md + en.md",
                    async () => {
                        const parsed = await service.parse({
                            paths: [
                                {
                                    relativePath: LIFECYCLE_RELATIVE_PATH,
                                    orderIndex: 1,
                                    displayId: "request-response-lifecycle",
                                },
                            ],
                            courseIndex: 0,
                            moduleIndex: 0,
                            contentIndex: 1,
                        })

                        expect(parsed.displayId).toBe("request-response-lifecycle")
                        expect(parsed.orderIndex).toBe(1)
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        expect(parsed.title).toBe("The request/response lifecycle")
                        expect(typeof parsed.description).toBe("string")
                        expect(parsed.description?.length ?? 0).toBeGreaterThan(0)
                        // legacy body is the inline `# body` Markdown blob (not a bodies/ folder)
                        expect(parsed.body).toContain("## 1. Opening")
                        expect(parsed.minutesRead).toBe(18)
                        expect(parsed.isPremium).toBe(false)

                        // `# references` → one row per `## N` heading-block, alias + url
                        expect(parsed.references).toHaveLength(3)
                        expect(typeof parsed.references?.[0]?.alias).toBe("string")
                        expect(parsed.references?.[0]?.url?.length ?? 0).toBeGreaterThan(0)

                        // root translations carry title/description/body for every locale
                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    contentId: parsed.id,
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Vòng đời request/response",
                                },
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "body",
                                }),
                            ]),
                        )
                    },
                )
            },
        )
    },
)
