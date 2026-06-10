import type {
    ChallengesFromDatabaseParams,
    ParseChallengeManyParams,
    ParseChallengeParams,
    ParseChallengeSubmissionsParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeDifficulty,
    ChallengeRequirementV2LangEntity,
    ChallengeOutputV2LangEntity,
    ChallengePrerequisiteV2LangEntity,
    ChallengeStepV2LangEntity,
    Locale,
    SubmissionType,
    ChallengeRequirementV2LangTranslationEntity,
    ChallengeStepV2LangTranslationEntity,
    ChallengeOutputV2LangTranslationEntity,
    ChallengePrerequisiteV2LangTranslationEntity,
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
    ChallengeOutputV2IdFactoryService,
    ChallengePrerequisiteV2IdFactoryService,
    ChallengeRequirementV2IdFactoryService,
    ChallengeStepV2IdFactoryService,
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
    ChallengeOutputV2Entity,
    ChallengePrerequisiteV2Entity,
    ChallengeRequirementV2Entity,
    ChallengeStepV2Entity,
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
/**
 * Challenge parser for mounted course files (`en.md`, `vi.md`).
 * Routes V2 vs legacy via {@link isV2} (`# verified`); V2 scalars merge via {@link MergeJsonService}.
 */
@Injectable()
export class ChallengeParserService {
    constructor(
        private readonly challengePathService: ChallengePathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
        private readonly challengeRequirementV2IdFactoryService: ChallengeRequirementV2IdFactoryService,
        private readonly challengeStepV2IdFactoryService: ChallengeStepV2IdFactoryService,
        private readonly challengeOutputV2IdFactoryService: ChallengeOutputV2IdFactoryService,
        private readonly challengePrerequisiteV2IdFactoryService: ChallengePrerequisiteV2IdFactoryService,
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
        }) as MergeJsonResult<DeepPartial<ChallengeEntity>>
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
            requirementsV2: ((merged.requirements ?? []) as Array<DeepPartial<ChallengeRequirementV2Entity>>).map(({
                orderIndex,
                langs,
            }) => {
                const challengeRequirementV2Id = this.challengeRequirementV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    orderIndex: orderIndex ?? 0,
                })
                return {
                    id: challengeRequirementV2Id,
                    orderIndex,
                    defaultLocale: Locale.En,
                    langs: ((langs ?? []) as Array<DeepPartial<ChallengeRequirementV2LangEntity>>)
                        .map<DeepPartial<ChallengeRequirementV2LangEntity>>((lang) => {
                            const challengeRequirementV2LangId = this.challengeRequirementV2IdFactoryService.generate({
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                requirementIndex: orderIndex ?? 0,
                                orderIndex: lang.orderIndex ?? 0,
                            })
                            return {
                                ...lang,
                                translations: (lang.translations ?? []).map<DeepPartial<ChallengeRequirementV2LangTranslationEntity>>((translation) => ({
                                    ...translation,
                                    challengeRequirementV2LangId,
                                })),
                                id: challengeRequirementV2LangId,
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
            stepsV2: ((merged.steps ?? []) as Array<DeepPartial<ChallengeStepV2Entity>>).map(({
                orderIndex,
                langs,
            }) => {
                const challengeStepV2Id = this.challengeStepV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    orderIndex: orderIndex ?? 0,
                })
                return {
                    id: challengeStepV2Id,
                    orderIndex,
                    defaultLocale: Locale.En,
                    langs: ((langs ?? []) as Array<DeepPartial<ChallengeStepV2LangEntity>>)
                        .map<DeepPartial<ChallengeStepV2LangEntity>>((lang) => {
                            const challengeStepV2LangId = this.challengeStepV2IdFactoryService.generate({
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                stepIndex: orderIndex ?? 0,
                                orderIndex: lang.orderIndex ?? 0,
                            })
                            return {
                                ...lang,
                                translations: (lang.translations ?? []).map<DeepPartial<ChallengeStepV2LangTranslationEntity>>((translation) => ({
                                    ...translation,
                                    challengeStepV2LangId,
                                })),
                                id: challengeStepV2LangId,
                                lang: this.coerceMdScalarService.toRequiredString(
                                    lang.lang,
                                    "text",
                                ),
                                defaultLocale: Locale.En,
                            }
                        }),
                }
            }),
            outputsV2: ((merged.outputs ?? []) as Array<DeepPartial<ChallengeOutputV2Entity>>).map(({
                orderIndex,
                langs,
            }) => {
                const challengeOutputV2Id = this.challengeOutputV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    orderIndex: orderIndex ?? 0,
                })
                return {
                    id: challengeOutputV2Id,
                    orderIndex,
                    defaultLocale: Locale.En,
                    langs: ((langs ?? []) as Array<DeepPartial<ChallengeOutputV2LangEntity>>)
                        .map((lang) => {
                            const challengeOutputV2LangId = this.challengeOutputV2IdFactoryService.generate({
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                outputIndex: orderIndex ?? 0,
                                orderIndex: lang.orderIndex ?? 0,
                            })
                            
                            return {
                                id: challengeOutputV2LangId,
                                lang: this.coerceMdScalarService.toRequiredString(
                                    lang.lang,
                                    "text",
                                ),
                                defaultLocale: Locale.En,
                                text: this.coerceMdScalarService.toNullableStringColumn(
                                    lang.text,
                                ),
                                translations: (lang.translations ?? []).map<DeepPartial<ChallengeOutputV2LangTranslationEntity>>((translation) => ({
                                    ...translation,
                                    challengeOutputV2LangId,
                                })),
                            }
                        }),
                }
            }),
            prerequisitesV2: (
                (merged.prerequisites ?? []) as Array<DeepPartial<ChallengePrerequisiteV2Entity>>
            ).map(({
                orderIndex,
                langs,
            }) => {
                const challengePrerequisiteV2Id = this.challengePrerequisiteV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    orderIndex: orderIndex ?? 0,
                })
                return {
                    id: challengePrerequisiteV2Id,
                    orderIndex,
                    defaultLocale: Locale.En,
                    langs: ((langs ?? []) as Array<DeepPartial<ChallengePrerequisiteV2LangEntity>>)
                        .map((lang) => {
                            const challengePrerequisiteV2LangId = this.challengePrerequisiteV2IdFactoryService.generate({
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                prerequisiteIndex: orderIndex ?? 0,
                                orderIndex: lang.orderIndex ?? 0,
                            })
                            return {
                                id: challengePrerequisiteV2LangId,
                                lang: this.coerceMdScalarService.toRequiredString(
                                    lang.lang,
                                    "text",
                                ),
                                defaultLocale: Locale.En,
                                text: this.coerceMdScalarService.toNullableStringColumn(
                                    lang.text,
                                ),
                                translations: (lang.translations ?? []).map<DeepPartial<ChallengePrerequisiteV2LangTranslationEntity>>((translation) => ({
                                    ...translation,
                                    challengePrerequisiteV2LangId,
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
        }: {
            criteria: unknown
            kind: "approach" | "outcome"
            challengeSubmissionId: string
            courseIndex: number
            moduleIndex: number
            contentIndex: number
            challengeIndex: number
            submissionIndex: number
        },
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
