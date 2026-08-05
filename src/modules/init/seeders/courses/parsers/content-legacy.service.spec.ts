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
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ContentPathService,
} from "../path/content.service"
import {
    ContentLegacyParserService,
} from "./content-legacy.service"

const COURSES_MOUNT_ROOT = path.join(
    process.cwd(),
    ".mount/data/courses",
)

/**
 * Relative path to a still-legacy (V1, inline `# body`) DevOps lesson.
 *
 * The original fixture here (`0-fullstack-mastery` M0 L1 `request-response-lifecycle`) has since
 * been migrated to the V2 `bodies/<N>-<lang>/` shape (it now carries a `# verified` marker and no
 * inline `# body` field), so it no longer exercises {@link ContentLegacyParserService}. DevOps
 * content is the last course still on the legacy inline-body format.
 */
const LEGACY_RELATIVE_PATH =
    "2-devops-mastery/modules/17-docker-and-oci-deep-dive/contents/3-buildkit-and-multi-arch"

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
                    "parses the legacy 3-buildkit-and-multi-arch lesson vi.md + en.md",
                    async () => {
                        const parsed = await service.parse({
                            paths: [
                                {
                                    relativePath: LEGACY_RELATIVE_PATH,
                                    orderIndex: 1,
                                    displayId: "buildkit-and-multi-arch",
                                },
                            ],
                            courseIndex: 0,
                            moduleIndex: 0,
                            contentIndex: 1,
                        })

                        expect(parsed.displayId).toBe("buildkit-and-multi-arch")
                        expect(parsed.orderIndex).toBe(1)
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        expect(parsed.title).toBe("BuildKit & Multi-Arch")
                        expect(typeof parsed.description).toBe("string")
                        expect(parsed.description?.length ?? 0).toBeGreaterThan(0)
                        // legacy body is the inline `# body` Markdown blob (not a bodies/ folder)
                        expect(parsed.body).toContain("## 1. Opening")
                        expect(parsed.minutesRead).toBe(26)
                        expect(parsed.isPremium).toBe(true)

                        // root translations carry title/description/body for every locale
                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    contentId: parsed.id,
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "BuildKit & Multi-Arch",
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
