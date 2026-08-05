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
} from "@modules/tests/utils/mocks/entity-manager.mock"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PersonalProjectTaskType,
} from "@modules/databases/postgresql/primary/enums/personal-project-task-type"
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
    CourseIdFactoryService,
} from "../id-factories/course.service"
import {
    MilestoneTaskApproachCriteriaLangIdFactoryService,
} from "../id-factories/milestone-task-approach-criteria-lang.service"
import {
    MilestoneTaskApproachCriteriaIdFactoryService,
} from "../id-factories/milestone-task-approach-criteria.service"
import {
    MilestoneTaskBriefIdFactoryService,
} from "../id-factories/milestone-task-brief.service"
import {
    MilestoneTaskOutcomeCriteriaLangIdFactoryService,
} from "../id-factories/milestone-task-outcome-criteria-lang.service"
import {
    MilestoneTaskOutcomeCriteriaIdFactoryService,
} from "../id-factories/milestone-task-outcome-criteria.service"
import {
    MilestoneTaskIdFactoryService,
} from "../id-factories/milestone-task.service"
import {
    MilestoneIdFactoryService,
} from "../id-factories/milestone.service"
import {
    ModuleIdFactoryService,
} from "../id-factories/module.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    MilestoneTaskPathService,
} from "../path/milestone-task.service"
import {
    MilestoneTaskParserService,
} from "./milestone-task.service"

const COURSES_MOUNT_ROOT = path.join(
    process.cwd(),
    ".mount/data/courses",
)

/**
 * Relative path under the `courses` context root for the SCHEMA V2
 * `0-clean-architecture-and-health` task -- the real mount fixture this spec grounds against
 * (the previously-referenced `3-postgresql-database-integration/.../health-db-readiness-probe`
 * task never existed on the mount; this points at an actual SCHEMA V2 task instead).
 */
const CLEAN_ARCHITECTURE_HEALTH_RELATIVE_PATH =
    "0-fullstack-mastery/milestones/0-project-foundation/tasks/0-clean-architecture-and-health"

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
                    MilestoneTaskBriefIdFactoryService,
                    MilestoneTaskOutcomeCriteriaIdFactoryService,
                    MilestoneTaskOutcomeCriteriaLangIdFactoryService,
                    MilestoneTaskApproachCriteriaIdFactoryService,
                    MilestoneTaskApproachCriteriaLangIdFactoryService,
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
                    {
                        // parse() never touches the DB, but the parser injects the primary
                        // entity manager (used by milestoneTasksFromDatabase) -> DI needs it
                        provide: getEntityManagerToken("primary"),
                        useValue: makeEntityManagerMock(),
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
                    "pivots the SCHEMA V2 lang-first markdown into briefs + outcome/approach criteria",
                    async () => {
                        const parsed = await service.parse({
                            paths: [
                                {
                                    relativePath: CLEAN_ARCHITECTURE_HEALTH_RELATIVE_PATH,
                                    orderIndex: 0,
                                    displayId: "clean-architecture-and-health",
                                },
                            ],
                            courseIndex: 0,
                            milestoneIndex: 0,
                            taskIndex: 0,
                        })

                        // root scalars -- En is the canonical default locale
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        // displayId = the task mount folder slug (index prefix stripped)
                        expect(parsed.displayId).toBe("clean-architecture-and-health")
                        expect(parsed.title).toBe("Scaffold StarCi Shop Backend + Health Endpoint")
                        expect(parsed.type).toBe(PersonalProjectTaskType.TechIntegrate)
                        expect(parsed.maxScore).toBe(100)
                        // `# verified` heading -> non-null Date marks this as a SCHEMA V2 task
                        expect(parsed.verified).toBeInstanceOf(Date)

                        // `# criterias` -> one brief per language block (typescript/java/csharp/go)
                        expect(parsed.briefs).toHaveLength(4)
                        expect(parsed.briefs?.[0]?.lang).toBe("typescript")
                        expect((parsed.briefs?.[0]?.body?.length ?? 0)).toBeGreaterThan(0)
                        // brief body is i18n -> each brief carries an aligned Vi translation row
                        expect(parsed.briefs?.[0]?.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "body",
                                }),
                            ]),
                        )

                        // outcome rubric is agnostic -> 3 criteria, each with one lang row per language block
                        expect(parsed.outcomeCriteria).toHaveLength(3)
                        expect(parsed.outcomeCriteria?.[0]?.score).toBe(10)
                        expect(parsed.outcomeCriteria?.[0]?.critical).toBe(true)
                        expect(parsed.outcomeCriteria?.[0]?.langs).toHaveLength(4)
                        expect((parsed.outcomeCriteria?.[0]?.langs?.[0]?.body?.length ?? 0)).toBeGreaterThan(0)

                        // approach rubric differs per language -> 3 criteria, each with one lang row per block
                        expect(parsed.approachCriteria).toHaveLength(3)
                        expect(parsed.approachCriteria?.[0]?.score).toBe(40)
                        expect(parsed.approachCriteria?.[0]?.critical).toBe(true)
                        expect(parsed.approachCriteria?.[0]?.langs).toHaveLength(4)

                        // root-level translations carry the Vi title row
                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "title",
                                }),
                            ]),
                        )
                    },
                )
            },
        )
    },
)
