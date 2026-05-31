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
    PersonalProjectTaskType,
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
    MilestoneIdFactoryService,
    MilestoneTaskIdFactoryService,
    MilestoneTaskPassCriteriaIdFactoryService,
    MilestoneTaskCodeImplementationIdFactoryService,
} from "../id-factories"
import {
    WinstonService,
} from "@modules/winston"
import {
    MilestoneTaskPathService,
} from "../path"
import {
    MilestoneTaskParserService,
} from "./milestone-task.service"

const COURSES_MOUNT_ROOT = path.join(
    process.cwd(),
    ".mount/data/courses",
)

/** Relative path under the `courses` context root for the M0 `0-project-initialization` task. */
const PROJECT_INITIALIZATION_RELATIVE_PATH =
    "0-fullstack-mastery/milestones/0-project-initialization-configuration/tasks/0-project-initialization"

describe("MilestoneTaskParserService",
    () => {
        let module: TestingModule
        let service: MilestoneTaskParserService

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
                    MilestoneTaskParserService,
                    ExtractJsonFromMdService,
                    CoerceMdScalarService,
                    MergeJsonService,
                    Sha256Service,
                    CourseIdFactoryService,
                    ModuleIdFactoryService,
                    MilestoneIdFactoryService,
                    MilestoneTaskIdFactoryService,
                    MilestoneTaskPassCriteriaIdFactoryService,
                    MilestoneTaskCodeImplementationIdFactoryService,
                    {
                        provide: ContextLoaderService,
                        useValue: contextLoaderService,
                    },
                    {
                        provide: MilestoneTaskPathService,
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

            service = module.get<MilestoneTaskParserService>(MilestoneTaskParserService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("parse",
            () => {
                it(
                    "parses 0-project-initialization en.md + vi.md (criteria + codeImplementations)",
                    async () => {
                        const parsed = await service.parse({
                            paths: [
                                {
                                    relativePath: PROJECT_INITIALIZATION_RELATIVE_PATH,
                                    orderIndex: 0,
                                    displayId: "project-initialization",
                                },
                            ],
                            courseIndex: 0,
                            milestoneIndex: 0,
                            taskIndex: 0,
                        })

                        // root scalars — En is the canonical default locale
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        expect(parsed.title).toBe("Project Initialization")
                        expect(
                            Object.values(PersonalProjectTaskType),
                        ).toContain(parsed.type)
                        expect(parsed.type).toBe(PersonalProjectTaskType.TechIntegrate)

                        // `# criterias` heading → 3 inline criteria rows, each carrying aligned translations
                        expect(parsed.criterias).toHaveLength(3)
                        expect(typeof parsed.criterias?.[0]?.text).toBe("string")
                        expect(parsed.criterias?.[0]?.text?.length ?? 0).toBeGreaterThan(0)
                        expect(typeof parsed.criterias?.[0]?.score).toBe("number")
                        expect(parsed.criterias?.[0]?.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "text",
                                }),
                            ]),
                        )

                        // `# codeImplementations` heading → 4 inline language rows
                        expect((parsed.codeImplementations?.length ?? 0)).toBeGreaterThan(0)
                        expect(typeof parsed.codeImplementations?.[0]?.lang).toBe("string")

                        // root-level translations carry the Vi title row
                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Khởi tạo dự án",
                                }),
                            ]),
                        )
                    },
                )
            },
        )
    },
)
