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
    ChallengeDifficulty,
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
    ChallengeIdFactoryService,
    ChallengeOutputIdFactoryService,
    ChallengePrerequisiteIdFactoryService,
    ChallengeRequirementIdFactoryService,
    ChallengeStepIdFactoryService,
    ChallengeSubmissionCriteriaIdFactoryService,
    ChallengeSubmissionIdFactoryService,
    ContentIdFactoryService,
    CourseIdFactoryService,
    ModuleIdFactoryService,
} from "../id-factories"
import {
    WinstonService,
} from "@modules/winston"
import {
    ChallengePathService,
} from "../path"
import {
    ChallengeParserService,
} from "./challenge.service"

const COURSES_MOUNT_ROOT = path.join(
    process.cwd(),
    ".mount/data/courses",
)

/** Relative path to both SCHEMA V2 challenges under frameworks-in-backend. */
const FRAMEWORKS_CHALLENGES_RELATIVE_PATH =
    "0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend/challenges"

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
    // accept both `{n}-{slug}` (challenges/contents) and bare numeric `{n}` (submissions)
    return entries
        .filter((entry) => entry.isDirectory() && /^\d+($|-)/u.test(entry.name))
        .map((entry) => {
            const dashIndex = entry.name.indexOf("-")
            const orderIndex = parseInt(
                dashIndex === -1 ? entry.name : entry.name.split("-")[0],
                10,
            )
            // bare numeric folder has no slug -> displayId is the bare number too
            const displayId = dashIndex === -1
                ? entry.name
                : entry.name.substring(dashIndex + 1)
            return {
                relativePath: `${relativeDir}/${entry.name}`.replace(/^\/+/u,
                    ""),
                orderIndex,
                displayId,
            }
        })
        .sort((prev, next) => prev.orderIndex - next.orderIndex)
}

describe("ChallengeParserService",
    () => {
        let module: TestingModule
        let service: ChallengeParserService
        let challengePaths: Array<ResolvedFilePath>

        beforeAll(async () => {
            challengePaths = await listIndexedMountDirs(FRAMEWORKS_CHALLENGES_RELATIVE_PATH)
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

            module = await Test.createTestingModule({
                providers: [
                    ChallengeParserService,
                    ExtractJsonFromMdService,
                    CoerceMdScalarService,
                    MergeJsonService,
                    Sha256Service,
                    CourseIdFactoryService,
                    ModuleIdFactoryService,
                    ContentIdFactoryService,
                    ChallengeIdFactoryService,
                    ChallengeRequirementIdFactoryService,
                    ChallengeStepIdFactoryService,
                    ChallengeOutputIdFactoryService,
                    ChallengePrerequisiteIdFactoryService,
                    ChallengeSubmissionIdFactoryService,
                    ChallengeSubmissionCriteriaIdFactoryService,
                    {
                        provide: ContextLoaderService,
                        useValue: contextLoaderService,
                    },
                    {
                        // submission folders live under `<challenge>/submissions/<N>/`; the spec
                        // discovers them on the real mount so the resolver lists from disk too
                        provide: PathResolverService,
                        useValue: {
                            filePaths: jest.fn(
                                async (
                                    _baseDir: string,
                                    relativePath: string,
                                ): Promise<Array<ResolvedFilePath>> => listIndexedMountDirs(relativePath),
                            ),
                        },
                    },
                    {
                        provide: ChallengePathService,
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

            service = module.get<ChallengeParserService>(ChallengeParserService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("parse",
            () => {
                it(
                    "parses 0-order-inventory-cross-module-di-easy",
                    async () => {
                        const parsed = await service.parse({
                            paths: challengePaths,
                            courseIndex: 0,
                            moduleIndex: 0,
                            contentIndex: 0,
                            challengeIndex: 0,
                        })

                        expect(parsed.displayId).toBe("order-inventory-cross-module-di-easy")
                        expect(parsed.orderIndex).toBe(0)
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        expect(parsed.title).toBe(
                            "Reuse a service across two areas via Dependency Injection",
                        )
                        expect(parsed.description).toBe(
                            "Build two independent business areas (order and inventory) and let order reuse the inventory service via dependency injection — without instantiating it itself. Pick your language; every language returns the same output contract.",
                        )
                        expect(parsed.difficulty).toBe(ChallengeDifficulty.Easy)
                        expect(parsed.score).toBe(100)
                        expect(parsed.verified).toEqual(new Date("2026-05-30"))

                        // ITEM-MAJOR shape: each `## N` is one item (a requirement position); its
                        // `langs[]` holds one row per programming language. Easy carries 4 languages
                        // (ts/java/csharp/go): 2 requirement items, 3 step items, 2 output items,
                        // 2 prerequisite items, each with 4 language rows.
                        expect(parsed.requirements).toHaveLength(2)
                        expect(parsed.requirements?.[0]?.orderIndex).toBe(0)
                        expect(parsed.requirements?.[0]?.langs).toHaveLength(4)
                        expect(parsed.requirements?.[0]?.langs?.[0]?.lang).toBe("typescript")
                        expect((parsed.requirements?.[0]?.langs?.[0] as { title?: string } | undefined)?.title).toBe(
                            "Split two independent modules and declare the export/import boundary",
                        )
                        // requirement lang rows keep score (numeric scalar)
                        expect((parsed.requirements?.[0]?.langs?.[0] as { score?: number } | undefined)?.score).toBe(40)
                        // En title/body live on the lang row; Vi rows live in its translations
                        expect((parsed.requirements?.[0]?.langs?.[0] as { translations?: unknown } | undefined)?.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Tách hai module độc lập và khai báo ranh giới export/import", // vn-ok: vi-locale seed fixture assertion
                                }),
                            ]),
                        )

                        expect(parsed.steps).toHaveLength(3)
                        expect(parsed.steps?.[0]?.langs).toHaveLength(4)
                        // outputs + prerequisites lang rows carry ONLY `text` (no title/body/score)
                        expect(parsed.outputs).toHaveLength(2)
                        expect(parsed.outputs?.[0]?.langs).toHaveLength(4)
                        expect(parsed.outputs?.[0]?.langs?.[0]?.lang).toBe("typescript")
                        expect(typeof (parsed.outputs?.[0]?.langs?.[0] as { text?: string } | undefined)?.text).toBe("string")
                        expect((parsed.outputs?.[0]?.langs?.[0] as { title?: unknown } | undefined)?.title).toBeUndefined()
                        expect(parsed.prerequisites).toHaveLength(2)
                        expect(parsed.prerequisites?.[0]?.langs).toHaveLength(4)
                        expect(typeof (parsed.prerequisites?.[0]?.langs?.[0] as { text?: string } | undefined)?.text).toBe("string")
                        expect((parsed.prerequisites?.[0]?.langs?.[0] as { title?: unknown } | undefined)?.title).toBeUndefined()

                        // di-easy ships one submission folder `submissions/0/` with the GitHub-URL rubric
                        expect(parsed.submissions).toHaveLength(1)
                        expect(parsed.submissions?.[0]?.orderIndex).toBe(0)
                        expect(parsed.submissions?.[0]?.type).toBe("githubUrl")
                        expect(parsed.submissions?.[0]?.title).toBe("GitHub Repository Link")
                        expect(parsed.submissions?.[0]?.score).toBe(100)
                        // rubric: per-language `langs[]` rows on each criterion, score summed onto submission
                        expect(parsed.submissions?.[0]?.outcomeCriteria?.length ?? 0).toBeGreaterThan(0)
                        expect(parsed.submissions?.[0]?.approachCriteria?.length ?? 0).toBeGreaterThan(0)
                        expect(parsed.submissions?.[0]?.outcomeCriteria?.[0]?.langs?.length ?? 0).toBeGreaterThan(0)
                        expect(parsed.submissions?.[0]?.outcomeCriteria?.[0]?.langs?.[0]?.lang).toBe("typescript")
                        expect(typeof parsed.submissions?.[0]?.outcomeCriteria?.[0]?.critical).toBe("boolean")
                        // approachScore + outcomeScore are sums of each rubric's per-criterion `## score`
                        expect((parsed.submissions?.[0]?.approachScore ?? 0) + (parsed.submissions?.[0]?.outcomeScore ?? 0))
                            .toBeGreaterThan(0)
                        // title + description rows for both locales (4 rows total)
                        expect(parsed.submissions?.[0]?.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "title",
                                }),
                                expect.objectContaining({
                                    locale: Locale.En,
                                    field: "title",
                                    value: "GitHub Repository Link",
                                }),
                            ]),
                        )

                        // root-level translations still carry every locale row for title/description
                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    challengeId: parsed.id,
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Dùng lại service giữa hai vùng qua Dependency Injection", // vn-ok: vi-locale seed fixture assertion
                                },
                            ]),
                        )
                    },
                )

                it(
                    "parses 1-custom-provider-dynamic-module-medium",
                    async () => {
                        const parsed = await service.parse({
                            paths: challengePaths,
                            courseIndex: 0,
                            moduleIndex: 0,
                            contentIndex: 0,
                            challengeIndex: 1,
                        })
                        expect(parsed.displayId).toBe("custom-provider-dynamic-module-medium")
                        expect(parsed.orderIndex).toBe(1)
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        expect(parsed.title).toBe(
                            "Swap implementations via DI and configure at compose time",
                        )
                        expect(parsed.difficulty).toBe(ChallengeDifficulty.Medium)
                        expect(parsed.score).toBe(100)
                        expect(parsed.verified).toEqual(new Date("2026-05-30"))

                        // medium has 3 lang buckets (ts/java/csharp) -> 3 entities per V2 section,
                        // each carrying its bucket items in `langs[]` (2 / 3 / 2 / 2 respectively)
                        expect(parsed.requirements).toHaveLength(2)
                        expect(parsed.requirements?.[0]?.orderIndex).toBe(0)
                        expect(parsed.requirements?.[0]?.langs).toHaveLength(3)
                        expect(parsed.requirements?.[0]?.langs?.[0]?.lang).toBe("typescript")
                        expect((parsed.requirements?.[0]?.langs?.[0] as { title?: string } | undefined)?.title).toBe(
                            "Define the Store interface + two implementations and a dynamic module forRoot(options)",
                        )
                        expect(parsed.steps).toHaveLength(3)
                        expect(parsed.steps).toHaveLength(3)
                        expect(parsed.steps?.[0]?.langs).toHaveLength(3)
                        expect(parsed.outputs).toHaveLength(2)
                        expect(parsed.outputs?.[0]?.langs).toHaveLength(3)
                        expect(typeof (parsed.outputs?.[0]?.langs?.[0] as { text?: string } | undefined)?.text).toBe("string")
                        expect(parsed.prerequisites).toHaveLength(2)
                        expect(parsed.prerequisites?.[0]?.langs).toHaveLength(3)
                        expect(typeof (parsed.prerequisites?.[0]?.langs?.[0] as { text?: string } | undefined)?.text).toBe("string")

                        // medium also ships one submission folder `submissions/0/`
                        expect(parsed.submissions).toHaveLength(1)
                        expect(parsed.submissions?.[0]?.type).toBe("githubUrl")
                        expect(parsed.submissions?.[0]?.title).toBe("GitHub Repository Link")

                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    challengeId: parsed.id,
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Hoán đổi implementation qua DI và cấu hình lúc compose", // vn-ok: vi-locale seed fixture assertion
                                },
                            ]),
                        )
                    },
                )
            },
        )
    },
)
