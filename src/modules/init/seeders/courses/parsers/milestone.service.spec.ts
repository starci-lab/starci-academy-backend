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
    ExtractJsonFromMdService,
} from "../../shared/extracts/extract-json-from-md.service"
import {
    MergeJsonService,
} from "../../shared/merge/merge.service"
import {
    CourseIdFactoryService,
} from "../id-factories/course.service"
import {
    MilestoneIdFactoryService,
} from "../id-factories/milestone.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    MilestonePathService,
} from "../path/milestone.service"
import {
    MilestoneParserService,
} from "./milestone.service"

/** Relative path to the M0 `project-foundation` milestone fixture folder. */
const PROJECT_INIT_RELATIVE_PATH =
    "0-fullstack-mastery/milestones/0-project-foundation"

describe("MilestoneParserService",
    () => {
        let module: TestingModule
        let service: MilestoneParserService

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
                    MilestoneParserService,
                    ExtractJsonFromMdService,
                    MergeJsonService,
                    Sha256Service,
                    CourseIdFactoryService,
                    MilestoneIdFactoryService,
                    {
                        provide: ContextLoaderService,
                        useValue: contextLoaderService,
                    },
                    {
                        provide: MilestonePathService,
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
                        // entity manager (used by milestonesFromDatabase) -> DI needs it
                        provide: getEntityManagerToken("primary"),
                        useValue: makeEntityManagerMock(),
                    },
                ],
            }).compile()

            service = module.get<MilestoneParserService>(MilestoneParserService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("parse",
            () => {
                it(
                    "parses the 0-project-initialization-configuration milestone vi.md + en.md",
                    async () => {
                        const parsed = await service.parse({
                            paths: [
                                {
                                    relativePath: PROJECT_INIT_RELATIVE_PATH,
                                    orderIndex: 0,
                                    displayId: "project-foundation",
                                },
                            ],
                            courseIndex: 0,
                            milestoneIndex: 0,
                        })

                        expect(parsed.orderIndex).toBe(0)
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        expect(parsed.title).toBe("Project Foundation")
                        expect(typeof parsed.description).toBe("string")
                        expect(parsed.description?.length ?? 0).toBeGreaterThan(0)

                        // root-level translations carry the Vietnamese title row
                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Nền Tảng Dự Án", // vn-ok: vi-locale seed fixture assertion
                                }),
                            ]),
                        )
                    },
                )

                it("filters empty translations and falls back for invalid sortIndex",
                    async () => {
                        const find = jest.fn().mockResolvedValue([])
                        const service = new MilestoneParserService(
                            {
                                extract: jest.fn().mockReturnValue({
                                }),
                            } as never,
                            {
                                generate: jest.fn().mockReturnValue("course-id"),
                            } as never,
                            {
                                generate: jest.fn().mockReturnValue("milestone-id"),
                            } as never,
                            {
                                load: jest.fn().mockResolvedValue("markdown"),
                            } as never,
                            {
                            } as never,
                            {
                                merge: jest.fn().mockReturnValue({
                                    title: "Milestone",
                                    description: "Description",
                                    sortIndex: "invalid",
                                    translations: [
                                        {
                                            locale: Locale.Vi,
                                            field: "title",
                                            value: "Nền tảng", // vn-ok: vi-locale parser fixture assertion
                                        },
                                        {
                                            locale: Locale.Vi,
                                            field: "description",
                                            value: "",
                                        },
                                    ],
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
                                relativePath: "course/milestones/4-demo",
                                orderIndex: 4,
                                displayId: "demo",
                            }],
                            courseIndex: 2,
                            milestoneIndex: 4,
                        })

                        expect(result.sortIndex).toBe(4)
                        expect(result.translations).toHaveLength(1)
                        expect(result.translations?.[0]?.value).toBe("Nền tảng") // vn-ok: vi-locale parser fixture assertion
                        await expect(service.milestonesFromDatabase({
                            courseIndex: 2,
                        })).resolves.toEqual([])
                        expect(find).toHaveBeenCalled()
                    })
            },
        )
    },
)
