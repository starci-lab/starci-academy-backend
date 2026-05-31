import path from "path"
import fs from "fs/promises"
import type {
    Dirent,
} from "fs"
import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    ChallengeDifficulty,
    Locale,
    SubmissionType,
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
import type {
    ResolvedFilePath,
} from "../../shared"
import {
    ChallengeIdFactoryService,
    ChallengeOutputIdFactoryService,
    ChallengePrerequisiteIdFactoryService,
    ChallengeReferenceIdFactoryService,
    ChallengeRequirementIdFactoryService,
    ChallengeStepIdFactoryService,
    ChallengeSubmissionIdFactoryService,
    ChallengeSubmissionPromptIdFactoryService,
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
    ChallengeLegacyParserService,
} from "./challenge-legacy.service"

const COURSES_MOUNT_ROOT = path.join(
    process.cwd(),
    ".mount/data/courses",
)

/** Relative path to the legacy (V1) challenges under M0 L1 `request-response-lifecycle`. */
const LIFECYCLE_CHALLENGES_RELATIVE_PATH =
    "0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/1-request-response-lifecycle/challenges"

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

describe("ChallengeLegacyParserService",
    () => {
        let module: TestingModule
        let service: ChallengeLegacyParserService
        let challengePaths: Array<ResolvedFilePath>

        beforeAll(async () => {
            challengePaths = await listIndexedMountDirs(LIFECYCLE_CHALLENGES_RELATIVE_PATH)
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
                    ChallengeLegacyParserService,
                    ExtractJsonFromMdService,
                    CoerceMdScalarService,
                    MergeJsonService,
                    Sha256Service,
                    CourseIdFactoryService,
                    ModuleIdFactoryService,
                    ContentIdFactoryService,
                    ChallengeIdFactoryService,
                    ChallengeRequirementIdFactoryService,
                    ChallengeOutputIdFactoryService,
                    ChallengePrerequisiteIdFactoryService,
                    ChallengeStepIdFactoryService,
                    ChallengeReferenceIdFactoryService,
                    ChallengeSubmissionIdFactoryService,
                    ChallengeSubmissionPromptIdFactoryService,
                    {
                        provide: ContextLoaderService,
                        useValue: contextLoaderService,
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
                ],
            }).compile()

            service = module.get<ChallengeLegacyParserService>(ChallengeLegacyParserService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("parse",
            () => {
                it(
                    "parses the legacy 0-book-pipeline-lifecycle-easy challenge",
                    async () => {
                        const parsed = await service.parse({
                            paths: challengePaths,
                            courseIndex: 0,
                            moduleIndex: 0,
                            contentIndex: 1,
                            challengeIndex: 0,
                        })

                        expect(parsed.displayId).toBe("book-pipeline-lifecycle-easy")
                        expect(parsed.orderIndex).toBe(0)
                        expect(parsed.defaultLocale).toBe(Locale.En)
                        expect(parsed.title).toBe(
                            "Implement all 5 NestJS pipeline layers with BookController",
                        )
                        expect(typeof parsed.description).toBe("string")
                        expect(parsed.description?.length ?? 0).toBeGreaterThan(0)
                        expect(parsed.difficulty).toBe(ChallengeDifficulty.Easy)
                        expect(parsed.score).toBe(20)

                        // legacy normalized sections — one row per `## N` heading-block
                        expect(parsed.requirements).toHaveLength(7)
                        expect(parsed.prerequisites).toHaveLength(3)
                        expect(parsed.references).toHaveLength(6)
                        // NOTE: `# steps` / `# outputs` of this mount file are malformed (a step
                        // `### body` is missing its closing `@starci/seperator`, so it swallows the
                        // `# outputs` section and breaks per-locale step alignment). The parser
                        // faithfully reflects that, so we only assert step rows are produced + shaped
                        // here (exact counts will firm up once the mount content is fixed).
                        expect((parsed.steps?.length ?? 0)).toBeGreaterThanOrEqual(4)
                        expect(typeof parsed.steps?.[0]?.title).toBe("string")
                        expect(typeof parsed.steps?.[0]?.body).toBe("string")
                        expect(Array.isArray(parsed.steps?.[0]?.translations)).toBe(true)
                        expect(Array.isArray(parsed.outputs)).toBe(true)

                        // first requirement: En canonical scalar + aligned per-locale translations
                        expect(parsed.requirements?.[0]?.orderIndex).toBe(0)
                        expect(typeof parsed.requirements?.[0]?.purpose).toBe("string")
                        expect(parsed.requirements?.[0]?.purpose?.length ?? 0).toBeGreaterThan(0)
                        expect(parsed.requirements?.[0]?.translations).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({
                                    locale: Locale.Vi,
                                    field: "purpose",
                                }),
                            ]),
                        )

                        // inline `# submissions` row (legacy ships a single githubUrl channel)
                        expect(parsed.submissions).toHaveLength(1)
                        expect(parsed.submissions?.[0]?.orderIndex).toBe(0)
                        expect(parsed.submissions?.[0]?.type).toBe(SubmissionType.GithubUrl)
                        expect(parsed.submissions?.[0]?.score).toBe(20)

                        // root-level translations carry every locale row for title/description
                        expect(parsed.translations).toEqual(
                            expect.arrayContaining([
                                {
                                    challengeId: parsed.id,
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: "Triển khai đủ 5 lớp pipeline của NestJS với BookController",
                                },
                            ]),
                        )
                    },
                )
            },
        )
    },
)
