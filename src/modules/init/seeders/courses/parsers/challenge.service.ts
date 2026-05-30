import type {
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
    ChallengeSubmissionIdFactoryService,
    ContentIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ChallengeEntity,
    ChallengeOutputV2Entity,
    ChallengePrerequisiteV2Entity,
    ChallengeRequirementV2Entity,
    ChallengeStepV2Entity,
    ChallengeSubmissionEntity,
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
 * SCHEMA V2 challenge parser for mounted course files (`en.md`, `vi.md`).
 * Scalars merge via {@link MergeJsonService}; `requirements` / `steps` / `outputs` /
 * `prerequisites` transpose lang-buckets from extract → `*V2` rows by hand in {@link parse}.
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
        private readonly pathResolverService: PathResolverService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Builds a partial V2 challenge entity graph from mounted course files.
     *
     * @param params - Challenge path list + course/module/content/challenge ordinals.
     * @returns Entity-shaped graph for the V2 insert service.
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
                "outputs.langs.title",
                "outputs.langs.body",
                "prerequisites.langs.title",
                "prerequisites.langs.body",
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
                    langs: ((langs ?? []) as Array<DeepPartial<ChallengeRequirementV2LangEntity>>)
                        .map((lang) => {
                            const challengeRequirementV2LangId = this.challengeRequirementV2IdFactoryService.generate({
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                requirementIndex: orderIndex ?? 0,
                                orderIndex: lang.orderIndex ?? 0,
                            })
                            return {
                                id: challengeRequirementV2LangId, 
                                score: this.coerceMdScalarService.toRequiredNumber(
                                    lang.score,
                                    0,
                                ),
                                ...lang,
                            }
                        }),
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
                    langs: ((langs ?? []) as Array<DeepPartial<ChallengeStepV2LangEntity>>)
                        .map((lang) => {
                            const challengeStepV2LangId = this.challengeStepV2IdFactoryService.generate({
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                stepIndex: orderIndex ?? 0,
                                orderIndex: lang.orderIndex ?? 0,
                            })
                            return {
                                id: challengeStepV2LangId,
                                ...lang,
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
                                ...lang,
                            }
                        }),
                }
            }),
            prerequisitesV2: ((merged.prerequisites ?? []) as Array<DeepPartial<ChallengePrerequisiteV2Entity>>).map(({
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
                                ...lang,
                            }
                        }),
                }
            }),
            // each `<challenge>/submissions/<N>/{locale}.md` folder → one submission row
            submissions: await this.parseSubmissions({
                challengeRelativePath: path.relativePath,
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                challengeId,
            }),
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
                score: this.coerceMdScalarService.toRequiredNumber(
                    merged.score,
                    0,
                ),
                challenge: {
                    id: challengeId,
                },
                translations: submissionTranslations,
            })
        }
        return submissions
    }

    /**
     * Parses many V2 challenges from the mount. Skips files without a parseable `# verified` day.
     *
     * @param params - Content folder path + course/module/content ordinals.
     * @returns Entity-shaped V2 graphs for the V2 insert service.
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
                // delegate the per-content build to parse(); skip + log on failure
                const challenge = await this.parse(
                    {
                        paths,
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex: path.orderIndex,
                    },
                )
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
}
