import type {
    ChallengesFromDatabaseParams,
    ParseChallengeManyParams,
    ParseChallengeParams,
    ParseChallengeSubmissionsParams,
    ParseCriteriaParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeDifficulty,
    ChallengeRequirementLangEntity,
    ChallengeOutputLangEntity,
    ChallengePrerequisiteLangEntity,
    ChallengeStepLangEntity,
    Locale,
    SubmissionType,
    ChallengeRequirementLangTranslationEntity,
    ChallengeStepLangTranslationEntity,
    ChallengeOutputLangTranslationEntity,
    ChallengePrerequisiteLangTranslationEntity,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    MergeJsonService,
    MergeJsonResult,
    ResolvedFileResult,
    ContextLoaderService,
    PathResolverService,
    logInitSeederEntitySkipped,
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
} from "../id-factories"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    ChallengeEntity,
    InjectPrimaryPostgreSQLEntityManager,
    ChallengeOutputEntity,
    ChallengePrerequisiteEntity,
    ChallengeRequirementEntity,
    ChallengeStepEntity,
    ChallengeSubmissionApproachCriteriaEntity,
    ChallengeSubmissionApproachCriteriaLangEntity,
    ChallengeSubmissionEntity,
    ChallengeSubmissionOutcomeCriteriaEntity,
    ChallengeSubmissionOutcomeCriteriaLangEntity,
    ChallengeSubmissionTranslationEntity,
} from "@modules/databases"
import {
    ChallengePathService,
} from "../path"
import {
    ChallengePathNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"
@Injectable()
/**
 * Challenge parser for mounted course files (`en.md`, `vi.md`).
 * Routes V2 vs legacy via {@link isV2} (`# verified`); V2 scalars merge via {@link MergeJsonService}.
 */
export class ChallengeParserService {
    constructor(
        private readonly challengePathService: ChallengePathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
        private readonly challengeRequirementIdFactoryService: ChallengeRequirementIdFactoryService,
        private readonly challengeStepIdFactoryService: ChallengeStepIdFactoryService,
        private readonly challengeOutputIdFactoryService: ChallengeOutputIdFactoryService,
        private readonly challengePrerequisiteIdFactoryService: ChallengePrerequisiteIdFactoryService,
        private readonly challengeSubmissionIdFactoryService: ChallengeSubmissionIdFactoryService,
        private readonly challengeSubmissionCriteriaIdFactoryService: ChallengeSubmissionCriteriaIdFactoryService,
        private readonly pathResolverService: PathResolverService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Builds a partial V2 challenge entity graph from mounted course files.
     *
     * @param params - Challenge path list + course/module/content/challenge ordinals.
     * @returns Entity-shaped graph for the V2 upsert service.
     */
    async parse(
        {
            paths,
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
        }: ParseChallengeParams,
    ): Promise<DeepPartial<ChallengeEntity>> {
        const path = paths.find(
            (candidate) => candidate.orderIndex === challengeIndex,
        )
        if (!path) {
            throw new ChallengePathNotFoundException(
                {
                    challengeIndex,
                },
            )
        }
        const jsonMap = new Map<Locale, Record<string, unknown>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load(
                        "courses",
                        `${path.relativePath}/${locale}.md`,
                    ),
                ),
            )
        }
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: jsonMap.get(locale) ?? {
                },
            })),
            translateFields: [
                "title",
                "description",
                "requirements.langs.title",
                "requirements.langs.body",
                "steps.langs.title",
                "steps.langs.body",
                "outputs.langs.text",
                "prerequisites.langs.text",
            ]
        }) as MergeJsonResult<DeepPartial<ChallengeEntity> & {
            // authored content keys (mapped into the V2 entities below); not on the entity itself
            requirements?: Array<Record<string, unknown>>
            steps?: Array<Record<string, unknown>>
            outputs?: Array<Record<string, unknown>>
            prerequisites?: Array<Record<string, unknown>>
        }>
        const challengeId = this.challengeIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
            },
        )
        return {
            id: challengeId,
            defaultLocale: Locale.En,
            displayId: path.displayId,
            contentId: this.contentIdFactoryService.generate(
                {
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                },
            ),
            title: this.coerceMdScalarService.toRequiredString(
                merged.title,
                "",
            ),
            description: this.coerceMdScalarService.toRequiredString(
                merged.description,
                "",
            ),
            difficulty: this.coerceMdScalarService.toRequiredEnum(
                merged.difficulty,
                ChallengeDifficulty,
                ChallengeDifficulty.Easy,
            ),
            score: this.coerceMdScalarService.toRequiredNumber(
                merged.score,
                0,
            ),
            verified: this.coerceMdScalarService.toNullableDate(merged.verified),
            orderIndex: challengeIndex,
            // pure display-ordering index — explicit `# sortIndex`, else falls back to orderIndex
            sortIndex: this.toSortIndex(
                (merged as { sortIndex?: unknown }).sortIndex,
                challengeIndex,
            ),
            translations: (merged.translations ?? []).map(
                ({
                    locale,
                    field,
                    value,
                }) => ({
                    challengeId,
                    locale,
                    field,
                    value,
                }),
            ),
            requirements: ((merged.requirements ?? []) as Array<DeepPartial<ChallengeRequirementEntity>>).map(({
                orderIndex,
                sortIndex,
                langs,
            }) => {
                const challengeRequirementId = this.challengeRequirementIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    orderIndex: orderIndex ?? 0,
                })
                return {
                    id: challengeRequirementId,
                    orderIndex,
                    sortIndex: typeof sortIndex === "number" ? sortIndex : (orderIndex ?? 0),
                    defaultLocale: Locale.En,
                    langs: ((langs ?? []) as Array<DeepPartial<ChallengeRequirementLangEntity>>)
                        .map<DeepPartial<ChallengeRequirementLangEntity>>((lang) => {
                            const challengeRequirementLangId = this.challengeRequirementIdFactoryService.generate({
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                requirementIndex: orderIndex ?? 0,
                                orderIndex: lang.orderIndex ?? 0,
                            })
                            return {
                                ...lang,
                                sortIndex: typeof lang.sortIndex === "number" ? lang.sortIndex : (lang.orderIndex ?? 0),
                                translations: (lang.translations ?? []).map<DeepPartial<ChallengeRequirementLangTranslationEntity>>((translation) => ({
                                    ...translation,
                                    challengeRequirementLangId,
                                })),
                                id: challengeRequirementLangId,
                                lang: this.coerceMdScalarService.toRequiredString(
                                    lang.lang,
                                    "text",
                                ),
                                defaultLocale: Locale.En,
                                score: this.coerceMdScalarService.toRequiredNumber(
                                    lang.score,
                                    0,
                                ),
                            }
                        }
                        ),
                }
            }),
            steps: ((merged.steps ?? []) as Array<DeepPartial<ChallengeStepEntity>>).map(({
                orderIndex,
                sortIndex,
                langs,
            }) => {
                const challengeStepId = this.challengeStepIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    orderIndex: orderIndex ?? 0,
                })
                return {
                    id: challengeStepId,
                    orderIndex,
                    sortIndex: typeof sortIndex === "number" ? sortIndex : (orderIndex ?? 0),
                    defaultLocale: Locale.En,
                    langs: ((langs ?? []) as Array<DeepPartial<ChallengeStepLangEntity>>)
                        .map<DeepPartial<ChallengeStepLangEntity>>((lang) => {
                            const challengeStepLangId = this.challengeStepIdFactoryService.generate({
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                stepIndex: orderIndex ?? 0,
                                orderIndex: lang.orderIndex ?? 0,
                            })
                            return {
                                ...lang,
                                sortIndex: typeof lang.sortIndex === "number" ? lang.sortIndex : (lang.orderIndex ?? 0),
                                translations: (lang.translations ?? []).map<DeepPartial<ChallengeStepLangTranslationEntity>>((translation) => ({
                                    ...translation,
                                    challengeStepLangId,
                                })),
                                id: challengeStepLangId,
                                lang: this.coerceMdScalarService.toRequiredString(
                                    lang.lang,
                                    "text",
                                ),
                                defaultLocale: Locale.En,
                            }
                        }),
                }
            }),
            outputs: ((merged.outputs ?? []) as Array<DeepPartial<ChallengeOutputEntity>>).map(({
                orderIndex,
                sortIndex,
                langs,
            }) => {
                const challengeOutputId = this.challengeOutputIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    orderIndex: orderIndex ?? 0,
                })
                return {
                    id: challengeOutputId,
                    orderIndex,
                    sortIndex: typeof sortIndex === "number" ? sortIndex : (orderIndex ?? 0),
                    defaultLocale: Locale.En,
                    langs: ((langs ?? []) as Array<DeepPartial<ChallengeOutputLangEntity>>)
                        .map((lang) => {
                            const challengeOutputLangId = this.challengeOutputIdFactoryService.generate({
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                outputIndex: orderIndex ?? 0,
                                orderIndex: lang.orderIndex ?? 0,
                            })

                            return {
                                id: challengeOutputLangId,
                                lang: this.coerceMdScalarService.toRequiredString(
                                    lang.lang,
                                    "text",
                                ),
                                defaultLocale: Locale.En,
                                sortIndex: typeof lang.sortIndex === "number" ? lang.sortIndex : (lang.orderIndex ?? 0),
                                text: this.coerceMdScalarService.toNullableStringColumn(
                                    lang.text,
                                ),
                                translations: (lang.translations ?? []).map<DeepPartial<ChallengeOutputLangTranslationEntity>>((translation) => ({
                                    ...translation,
                                    challengeOutputLangId,
                                })),
                            }
                        }),
                }
            }),
            prerequisites: (
                (merged.prerequisites ?? []) as Array<DeepPartial<ChallengePrerequisiteEntity>>
            ).map(({
                orderIndex,
                sortIndex,
                langs,
            }) => {
                const challengePrerequisiteId = this.challengePrerequisiteIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    orderIndex: orderIndex ?? 0,
                })
                return {
                    id: challengePrerequisiteId,
                    orderIndex,
                    sortIndex: typeof sortIndex === "number" ? sortIndex : (orderIndex ?? 0),
                    defaultLocale: Locale.En,
                    langs: ((langs ?? []) as Array<DeepPartial<ChallengePrerequisiteLangEntity>>)
                        .map((lang) => {
                            const challengePrerequisiteLangId = this.challengePrerequisiteIdFactoryService.generate({
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                prerequisiteIndex: orderIndex ?? 0,
                                orderIndex: lang.orderIndex ?? 0,
                            })
                            return {
                                id: challengePrerequisiteLangId,
                                lang: this.coerceMdScalarService.toRequiredString(
                                    lang.lang,
                                    "text",
                                ),
                                defaultLocale: Locale.En,
                                sortIndex: typeof lang.sortIndex === "number" ? lang.sortIndex : (lang.orderIndex ?? 0),
                                text: this.coerceMdScalarService.toNullableStringColumn(
                                    lang.text,
                                ),
                                translations: (lang.translations ?? []).map<DeepPartial<ChallengePrerequisiteLangTranslationEntity>>((translation) => ({
                                    ...translation,
                                    challengePrerequisiteLangId,
                                })),
                            }
                        }),
                }
            }),
            // each `<challenge>/submissions/<N>/{locale}.md` folder → one submission row
            submissions: await this.parseSubmissions(
                {
                    challengeRelativePath: path.relativePath,
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    challengeId,
                }
            ),
        }
    }
    /**
     * Resolves the `# sortIndex` mount value (pure display order), falling back to the
     * entity's `orderIndex` when it is missing or not a finite number.
     *
     * @param raw - Raw scalar read from the mount file.
     * @param fallback - The orderIndex to use when `# sortIndex` is absent.
     * @returns The resolved sort index.
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback
    }

    /**
     * Loads SCHEMA V2 submissions from `<challenge>/submissions/<N>/{locale}.md`.
     * Each folder holds `{locale}.md` with `# type` / `# title` / `# description` / `# score`;
     * `title` + `description` are translatable and carried into per-locale `translations` rows.
     *
     * @param params - Challenge folder path + ordinals + parent challenge id.
     * @returns Submission entity partials (empty when `submissions/` is absent).
     */
    private async parseSubmissions(
        {
            challengeRelativePath,
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
            challengeId,
        }: ParseChallengeSubmissionsParams,
    ): Promise<Array<DeepPartial<ChallengeSubmissionEntity>>> {
        // list numeric submission folders; absent `submissions/` dir yields zero rows
        const paths = await this.pathResolverService.filePaths(
            "courses",
            `${challengeRelativePath}/submissions`,
        )
        const submissions: Array<DeepPartial<ChallengeSubmissionEntity>> = []
        for (const path of paths) {
            // extract every locale's submission markdown — missing locale file collapses to {}
            const submissionJsonMap = new Map<Locale, Record<string, unknown>>()
            for (const locale of Object.values(Locale)) {
                try {
                    submissionJsonMap.set(
                        locale,
                        this.extractJsonFromMdService.extract(
                            await this.contextLoaderService.load(
                                "courses",
                                `${path.relativePath}/${locale}.md`,
                            ),
                        ),
                    )
                } catch {
                    submissionJsonMap.set(
                        locale,
                        {
                        },
                    )
                }
            }
            const submissionOrderIndex = path.orderIndex
            const challengeSubmissionId = this.challengeSubmissionIdFactoryService.generate({
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                submissionIndex: submissionOrderIndex,
            })
            // merge title/description across locales — type/score/url are scalar (no translation)
            const merged = this.mergeJsonService.merge({
                jsons: Object.values(Locale).map((locale) => ({
                    locale,
                    json: submissionJsonMap.get(locale) ?? {
                    },
                })),
                translateFields: [
                    "title",
                    "description",
                ],
            })
            // map merged translation rows onto the submission's FK; URL/type/score not translated
            const submissionTranslations: Array<DeepPartial<ChallengeSubmissionTranslationEntity>> =
                (merged.translations ?? [])
                    .map(({
                        locale,
                        field,
                        value,
                    }) => ({
                        challengeSubmissionId,
                        locale,
                        field,
                        value,
                    }))
            // English-only rubric blocks (approach/outcome) — extract walks straight into the criteria
            // array now that the mount drops the outer separator wrap
            const approach = this.parseCriteria({
                criteria: (merged as Record<string, unknown>).approachCriterias,
                kind: "approach",
                challengeSubmissionId,
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                submissionIndex: submissionOrderIndex,
            })
            const outcome = this.parseCriteria({
                criteria: (merged as Record<string, unknown>).outcomeCriterias,
                kind: "outcome",
                challengeSubmissionId,
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                submissionIndex: submissionOrderIndex,
            })
            submissions.push({
                id: challengeSubmissionId,
                orderIndex: submissionOrderIndex,
                sortIndex: this.toSortIndex(
                    (merged as { sortIndex?: unknown }).sortIndex,
                    submissionOrderIndex,
                ),
                type: this.coerceMdScalarService.toRequiredEnum(
                    merged.type,
                    SubmissionType,
                    SubmissionType.GithubUrl,
                ),
                title: this.coerceMdScalarService.toRequiredString(
                    merged.title,
                    "",
                ),
                description: this.coerceMdScalarService.toNullableStringColumn(
                    merged.description,
                ),
                // submission.score keeps the scalar from markdown; approach/outcome scores break it down
                score: this.coerceMdScalarService.toRequiredNumber(
                    merged.score,
                    0,
                ),
                approachScore: approach.totalScore,
                outcomeScore: outcome.totalScore,
                challenge: {
                    id: challengeId,
                },
                translations: submissionTranslations,
                approachCriteria: approach.rows as Array<DeepPartial<ChallengeSubmissionApproachCriteriaEntity>>,
                outcomeCriteria: outcome.rows as Array<DeepPartial<ChallengeSubmissionOutcomeCriteriaEntity>>,
            })
        }
        return submissions
    }

    /**
     * Maps one rubric section (`# approachCriterias` / `# outcomeCriterias`) into normalized criterion
     * + per-language entity partials, plus the per-section weight total (sum of every criterion's
     * `## score`).
     *
     * Mount shape (no separator wrap on the outer heading): `# <n>` (criterion) → `## body` →
     * `### <m>` (lang bucket with `#### lang` / `#### body`), `## score`, `## critical`.
     *
     * @param params - Extracted criteria array + rubric kind + parent submission ordinals.
     * @returns `{ rows, totalScore }` — entity rows for cascade + the sum used as approach/outcome score.
     */
    private parseCriteria(
        {
            criteria,
            kind,
            challengeSubmissionId,
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
            submissionIndex,
        }: ParseCriteriaParams,
    ): {
        rows: Array<DeepPartial<ChallengeSubmissionApproachCriteriaEntity>>
        totalScore: number
        } {
        // absent or wrong shape → empty rubric (insert layer treats this as null jsonb / empty rows)
        if (!Array.isArray(criteria)) {
            return {
                rows: [],
                totalScore: 0,
            }
        }
        let totalScore = 0
        const rows = (criteria as Array<Record<string, unknown>>).map((criterion) => {
            // each criterion's `orderIndex` was injected by ExtractJsonFromMdService.buildArray
            const criterionIndex = this.coerceMdScalarService.toRequiredNumber(
                criterion.orderIndex,
                0,
            )
            const criterionId = this.challengeSubmissionCriteriaIdFactoryService.generate({
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                submissionIndex,
                kind,
                criterionIndex,
            })
            // `## body` is itself a numeric-keyed array → one lang bucket per `### N`
            const langItems = Array.isArray(criterion.body)
                ? (criterion.body as Array<Record<string, unknown>>)
                : []
            const langs = langItems.map((langItem, langArrayIndex) => {
                const langIndex = this.coerceMdScalarService.toRequiredNumber(
                    langItem.orderIndex,
                    langArrayIndex,
                )
                return {
                    id: this.challengeSubmissionCriteriaIdFactoryService.generateLang({
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        submissionIndex,
                        kind,
                        criterionIndex,
                        langIndex,
                    }),
                    lang: this.coerceMdScalarService.toRequiredString(
                        langItem.lang,
                        "text"
                    ),
                    body: this.coerceMdScalarService.toNullableStringColumn(
                        langItem.body
                    ),
                } as DeepPartial<ChallengeSubmissionApproachCriteriaLangEntity>
            })
            // accumulate per-criterion `## score` into the section total (approach/outcome weight)
            totalScore += this.coerceMdScalarService.toRequiredNumber(
                criterion.score,
                0
            )
            return {
                id: criterionId,
                orderIndex: criterionIndex,
                sortIndex: this.toSortIndex(
                    criterion.sortIndex,
                    criterionIndex,
                ),
                critical: this.coerceMdScalarService.toRequiredBoolean(
                    criterion.critical,
                    false
                ),
                challengeSubmission: {
                    id: challengeSubmissionId,
                },
                langs: langs as Array<DeepPartial<ChallengeSubmissionApproachCriteriaLangEntity | ChallengeSubmissionOutcomeCriteriaLangEntity>>,
            }
        })
        return {
            rows,
            totalScore,
        }
    }

    /**
     * Parses many challenges from the mount. V2 when {@link isV2}; otherwise legacy parser.
     *
     * @param params - Content folder path + course/module/content ordinals.
     * @returns Entity-shaped graphs for the challenge upsert service.
     */
    async parseMany(
        {
            contentRelativePath,
            courseIndex,
            moduleIndex,
            contentIndex,
        }: ParseChallengeManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<ChallengeEntity>>>> {
        const paths = await this.challengePathService.paths(
            {
                contentRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<ChallengeEntity>>> = []
        for (const path of paths) {
            try {
                const parseParams = {
                    paths,
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex: path.orderIndex,
                }
                // all mounted challenges are SCHEMA V2 (legacy parser removed)
                const challenge = await this.parse(parseParams)
                data.push({
                    data: challenge,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    ChallengeEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }
    
    /**
     * Loads persisted challenges for one content scope (DB inspection / sync checks).
     *
     * @param params - Course/module/content ordinals.
     * @returns Challenge rows keyed by deterministic `contentId`.
     */
    async challengesFromDatabase(
        params: ChallengesFromDatabaseParams,
    ): Promise<Array<ChallengeEntity>> {
        const {
            courseIndex,
            moduleIndex,
            contentIndex,
        } = params
        const contentId = this.contentIdFactoryService.generate({
            courseIndex,
            moduleIndex,
            contentIndex,
        })
        return this.entityManager.find(
            ChallengeEntity,
            {
                where: {
                    content: {
                        id: contentId,
                    },
                },
            },
        )
    }
}
