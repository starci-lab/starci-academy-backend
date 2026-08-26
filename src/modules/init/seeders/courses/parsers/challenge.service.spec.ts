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
import {
    COURSE_PARSER_FIXTURE_ROOT,
} from "@tests/fixtures/course-parser/root"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    ChallengeDifficulty,
} from "@modules/databases/postgresql/primary/enums/challenge-difficulty"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
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
    PathResolverService,
} from "../../shared/path/resolver.service"
import type {
    ResolvedFilePath,
} from "../../shared/path/types"
import {
    ChallengeOutputIdFactoryService,
} from "../id-factories/challenge-output.service"
import {
    ChallengePrerequisiteIdFactoryService,
} from "../id-factories/challenge-prerequisite.service"
import {
    ChallengeRequirementIdFactoryService,
} from "../id-factories/challenge-requirement.service"
import {
    ChallengeStepIdFactoryService,
} from "../id-factories/challenge-step.service"
import {
    ChallengeSubmissionCriteriaIdFactoryService,
} from "../id-factories/challenge-submission-criteria.service"
import {
    ChallengeSubmissionIdFactoryService,
} from "../id-factories/challenge-submission.service"
import {
    ChallengeIdFactoryService,
} from "../id-factories/challenge.service"
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
    ChallengePathService,
} from "../path/challenge.service"
import {
    ChallengeParserService,
} from "./challenge.service"

/** Relative path to both SCHEMA V2 challenges under frameworks-in-backend. */
const FRAMEWORKS_CHALLENGES_RELATIVE_PATH =
    "0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend/challenges"

/**
 * Lists indexed fixture folders (`{orderIndex}-{slug}`) under a courses-relative directory.
 *
 * @param relativeDir - Path under the repository-owned parser fixture.
 * @returns Resolved paths sorted by `orderIndex`.
 */
async function listIndexedFixtureDirs(
    relativeDir: string,
): Promise<Array<ResolvedFilePath>> {
    const absoluteDir = path.join(
        COURSE_PARSER_FIXTURE_ROOT,
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
            challengePaths = await listIndexedFixtureDirs(FRAMEWORKS_CHALLENGES_RELATIVE_PATH)
        })

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
                        // discovers them from the tracked fixture so the resolver lists from disk too
                        provide: PathResolverService,
                        useValue: {
                            filePaths: jest.fn(
                                async (
                                    _baseDir: string,
                                    relativePath: string,
                                ): Promise<Array<ResolvedFilePath>> => listIndexedFixtureDirs(relativePath),
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
                it("rejects a challenge ordinal that is not mounted",
                    async () => {
                        await expect(service.parse({
                            paths: [],
                            courseIndex: 0,
                            moduleIndex: 0,
                            contentIndex: 0,
                            challengeIndex: 9,
                        })).rejects.toMatchObject({
                            code: "CHALLENGE_PATH_NOT_FOUND_EXCEPTION",
                        })
                    })

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

        it("keeps valid challenges when parseMany skips a malformed sibling",
            async () => {
                const pathService = module.get(ChallengePathService)
                const winston = module.get(WinstonService)
                jest.mocked(pathService.paths).mockResolvedValue([
                    {
                        relativePath: "course/challenges/0-valid",
                        orderIndex: 0,
                        displayId: "valid",
                    },
                    {
                        relativePath: "course/challenges/1-invalid",
                        orderIndex: 1,
                        displayId: "invalid",
                    },
                ])
                jest.spyOn(service,
                    "parse")
                    .mockResolvedValueOnce({
                        id: "challenge-id"
                    } as never)
                    .mockRejectedValueOnce(new Error("bad challenge"))

                const result = await service.parseMany({
                    contentRelativePath: "course/content",
                    courseIndex: 2,
                    moduleIndex: 3,
                    contentIndex: 4,
                })

                expect(result).toHaveLength(1)
                expect(result[0]?.relativePath).toBe("course/challenges/0-valid")
                expect(winston.log).toHaveBeenCalledTimes(1)
            })

        it("loads persisted challenges by the deterministic content id",
            async () => {
                const rows = [{
                    id: "challenge-1"
                }] as never
                const manager = module.get(getEntityManagerToken("primary"))
                jest.mocked(manager.find).mockResolvedValue(rows)

                await expect(service.challengesFromDatabase({
                    courseIndex: 2,
                    moduleIndex: 3,
                    contentIndex: 4,
                })).resolves.toBe(rows)
                expect(manager.find).toHaveBeenCalledWith(
                    ChallengeEntity,
                    {
                        where: {
                            content: {
                                id: expect.any(String),
                            },
                        },
                    },
                )
            })

        it("normalizes an absent rubric and preserves score totals for criteria rows",
            () => {
                const parser = service as unknown as {
                    parseCriteria: (params: {
                        criteria: unknown
                        kind: "approach" | "outcome"
                        challengeSubmissionId: string
                        courseIndex: number
                        moduleIndex: number
                        contentIndex: number
                        challengeIndex: number
                        submissionIndex: number
                    }) => { rows: Array<{ orderIndex: number; critical: boolean }>; totalScore: number }
                }
                expect(parser.parseCriteria({
                    criteria: undefined,
                    kind: "outcome",
                    challengeSubmissionId: "submission-id",
                    courseIndex: 0,
                    moduleIndex: 0,
                    contentIndex: 0,
                    challengeIndex: 0,
                    submissionIndex: 0,
                })).toEqual({
                    rows: [], totalScore: 0
                })

                const result = parser.parseCriteria({
                    criteria: [{
                        orderIndex: 2,
                        score: 25,
                        critical: true,
                        body: [],
                    },
                    {
                    }],
                    kind: "approach",
                    challengeSubmissionId: "submission-id",
                    courseIndex: 0,
                    moduleIndex: 0,
                    contentIndex: 0,
                    challengeIndex: 0,
                    submissionIndex: 0,
                })
                expect(result.totalScore).toBe(25)
                expect(result.rows).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        orderIndex: 2, critical: true
                    }),
                    expect.objectContaining({
                        orderIndex: 0, critical: false,
                    }),
                ]))
            })

        it("keeps a submission row when either locale markdown cannot be read",
            async () => {
                const paths = module.get(PathResolverService)
                const loader = module.get(ContextLoaderService)
                const merge = module.get(MergeJsonService)
                jest.mocked(paths.filePaths).mockResolvedValue([{
                    relativePath: "course/challenges/0-demo/submissions/0",
                    orderIndex: 0,
                    displayId: "0",
                }])
                jest.mocked(loader.load).mockRejectedValue(new Error("missing submission"))
                jest.spyOn(merge,
                    "merge").mockReturnValue({
                    } as never)
                const parser = service as unknown as {
                    parseSubmissions: (params: {
                        challengeRelativePath: string
                        courseIndex: number
                        moduleIndex: number
                        contentIndex: number
                        challengeIndex: number
                        challengeId: string
                    }) => Promise<Array<{ challenge?: { id?: string }; translations?: Array<unknown> }>>
                }

                const result = await parser.parseSubmissions({
                    challengeRelativePath: "course/challenges/0-demo",
                    courseIndex: 0,
                    moduleIndex: 0,
                    contentIndex: 0,
                    challengeIndex: 0,
                    challengeId: "challenge-id",
                })
                expect(result).toHaveLength(1)
                expect(result[0]?.challenge?.id).toBe("challenge-id")
                expect(result[0]?.translations).toEqual([])
            })

        it("uses safe defaults when the merged challenge has no optional sections",
            async () => {
                const paths = module.get(PathResolverService)
                const merge = module.get(MergeJsonService)
                jest.mocked(paths.filePaths).mockResolvedValue([])
                jest.spyOn(merge,
                    "merge").mockReturnValue({
                    } as never)

                const result = await service.parse({
                    paths: [challengePaths[0] as ResolvedFilePath],
                    courseIndex: 0,
                    moduleIndex: 0,
                    contentIndex: 0,
                    challengeIndex: 0,
                })

                expect(result.title).toBe("")
                expect(result.description).toBe("")
                expect(result.score).toBe(0)
                expect(result.requirements).toEqual([])
                expect(result.steps).toEqual([])
                expect(result.outputs).toEqual([])
                expect(result.prerequisites).toEqual([])
                expect(result.submissions).toEqual([])
            })

        it("normalizes sparse requirement, step, output, and prerequisite rows",
            async () => {
                const paths = module.get(PathResolverService)
                const merge = module.get(MergeJsonService)
                jest.mocked(paths.filePaths).mockResolvedValue([])
                jest.spyOn(merge,
                    "merge").mockReturnValue({
                        requirements: [{
                        },
                        {
                            sortIndex: 1,
                            langs: [{
                                sortIndex: 1,
                                orderIndex: 1,
                            }],
                        }],
                        steps: [{
                        },
                        {
                            sortIndex: 1,
                            langs: [{
                                sortIndex: 1,
                                orderIndex: 1,
                            }],
                        }],
                        outputs: [{
                        },
                        {
                            sortIndex: 1,
                            langs: [{
                                sortIndex: 1,
                                orderIndex: 1,
                            }],
                        }],
                        prerequisites: [{
                        },
                        {
                            sortIndex: 1,
                            langs: [{
                                sortIndex: 1,
                                orderIndex: 1,
                            }],
                        }],
                        translations: [],
                    } as never)

                const result = await service.parse({
                    paths: [challengePaths[0] as ResolvedFilePath],
                    courseIndex: 0,
                    moduleIndex: 0,
                    contentIndex: 0,
                    challengeIndex: 0,
                })

                expect(result.requirements).toHaveLength(2)
                expect(result.requirements?.[1]?.langs).toHaveLength(1)
                expect(result.steps).toHaveLength(2)
                expect(result.steps?.[1]?.langs).toHaveLength(1)
                expect(result.outputs).toHaveLength(2)
                expect(result.outputs?.[1]?.langs).toHaveLength(1)
                expect(result.prerequisites).toHaveLength(2)
                expect(result.prerequisites?.[1]?.langs).toHaveLength(1)
            })

        it("coerces rubric language values and ignores a malformed body bucket",
            () => {
                const parser = service as unknown as {
                    parseCriteria: (params: {
                        criteria: unknown
                        kind: "approach" | "outcome"
                        challengeSubmissionId: string
                        courseIndex: number
                        moduleIndex: number
                        contentIndex: number
                        challengeIndex: number
                        submissionIndex: number
                    }) => { rows: Array<{ langs: Array<{ lang: string; body: string | null }> }>; totalScore: number }
                }

                const result = parser.parseCriteria({
                    criteria: [{
                        orderIndex: 3,
                        sortIndex: 8,
                        score: 12,
                        critical: true,
                        body: "not-an-array",
                    },
                    {
                        orderIndex: 4,
                        score: 5,
                        critical: false,
                        body: [{
                            orderIndex: 2,
                            lang: "vi",
                            body: "Description",
                        }],
                    }],
                    kind: "outcome",
                    challengeSubmissionId: "submission-id",
                    courseIndex: 0,
                    moduleIndex: 0,
                    contentIndex: 0,
                    challengeIndex: 0,
                    submissionIndex: 0,
                })

                expect(result.totalScore).toBe(17)
                expect(result.rows[0]?.langs).toEqual([])
                expect(result.rows[1]?.langs).toEqual([
                    expect.objectContaining({
                        lang: "vi",
                        body: "Description",
                    }),
                ])
            })

        it("resolves finite sort indexes and falls back for invalid values",
            () => {
                const parser = service as unknown as {
                    toSortIndex: (value: unknown, fallback: number) => number
                }

                expect(parser.toSortIndex(" 5 ",
                    1)).toBe(5)
                expect(parser.toSortIndex(3,
                    1)).toBe(3)
                expect(parser.toSortIndex("bad",
                    1)).toBe(1)
                expect(parser.toSortIndex(undefined,
                    1)).toBe(1)
            })

        it("returns an empty rubric when criteria are absent rather than malformed",
            () => {
                const parser = service as unknown as {
                    parseCriteria: (params: Record<string, unknown>) => {
                        rows: Array<unknown>
                        totalScore: number
                    }
                }

                expect(parser.parseCriteria({
                    criteria: undefined,
                    kind: "outcome",
                    challengeSubmissionId: "submission-id",
                    courseIndex: 0,
                    moduleIndex: 0,
                    contentIndex: 0,
                    challengeIndex: 0,
                    submissionIndex: 0,
                })).toEqual({
                    rows: [],
                    totalScore: 0,
                })
            })
    },
)
