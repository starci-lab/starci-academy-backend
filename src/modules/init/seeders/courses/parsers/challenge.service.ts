import type {
    ParseChallengeManyParams,
    ParseChallengeParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeDifficulty,
    Locale,
    SubmissionType,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    MergeJsonService,
    MergeJsonResult,
} from "../../shared"
import {
    ChallengeIdFactoryService,
    ChallengeOutputIdFactoryService,
    ChallengePrerequisiteIdFactoryService,
    ChallengeSubmissionPromptIdFactoryService,
    ChallengeRequirementIdFactoryService,
    ChallengeStepCodeImplementationIdFactoryService,
    ChallengeStepIdFactoryService,
    ChallengeSubmissionIdFactoryService,
    ChallengeReferenceIdFactoryService,
    ContentIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ChallengeEntity,
    ChallengeStepCodeImplementationEntity,
    ChallengeStepCodeImplementationTranslationEntity,
    ChallengeSubmissionPromptEntity,
} from "@modules/databases"
import {
    ChallengePathService,
} from "../path"
import {
    ResolvedFileResult,
    ContextLoaderService,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    ChallengePathNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"

/**
 * Parses challenge from mounted course files (`en.md` / `vi.md`).
 *
 * i18n follows the same merge pattern as {@link CourseParserService} /
 * {@link ContentParserService}: per-locale extracts are merged into one default-locale tree whose
 * configured `translateFields` (top-level + one-level array dot-paths) carry their translation rows.
 * Scalar fields like `difficulty` / `score` use camelCase `#` headings in `en.md`. The two-level
 * nested rows (`steps.codeImplementations`, `submissions.prompts`) are filled per-locale from the
 * extract map since the merge only resolves a single array level.
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
        private readonly challengeSubmissionPromptIdFactoryService: ChallengeSubmissionPromptIdFactoryService,
        private readonly challengeSubmissionIdFactoryService: ChallengeSubmissionIdFactoryService,
        private readonly challengeStepIdFactoryService: ChallengeStepIdFactoryService,
        private readonly challengeStepCodeImplementationIdFactoryService: ChallengeStepCodeImplementationIdFactoryService,
        private readonly challengeReferenceIdFactoryService: ChallengeReferenceIdFactoryService,
        private readonly challengeRequirementIdFactoryService: ChallengeRequirementIdFactoryService,
        private readonly challengeOutputIdFactoryService: ChallengeOutputIdFactoryService,
        private readonly challengePrerequisiteIdFactoryService: ChallengePrerequisiteIdFactoryService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Builds a partial challenge entity from mounted course files.
     *
     * @param params - Challenge path list + course/module/content/challenge ordinals.
     * @returns Entity-shaped graph for TypeORM cascade save.
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
        // locate the folder for this challenge ordinal
        const path = paths.find(
            (path) => path.orderIndex === challengeIndex,
        )
        if (!path) {
            throw new ChallengePathNotFoundException(
                {
                    challengeIndex,
                },
            )
        }
        // extract the heading structure for every locale's markdown file
        const jsonMap = new Map<Locale, Partial<ChallengeEntity>>()
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
        // merge locales into one default-locale doc + per-field translation rows; the merge resolves
        // top-level scalars and ONE array level (each row gets its own `translations`)
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: (jsonMap.get(locale) ?? {
                }) as Record<string, unknown>,
            })),
            translateFields: [
                "title",
                "description",
                "requirements.purpose",
                "requirements.technicalConstraints",
                "requirements.proTipsHints",
                "requirements.forbidden",
                "requirements.promptText",
                "outputs.text",
                "prerequisites.text",
                "references.alias",
                "steps.title",
                "steps.body",
                "submissions.title",
                "submissions.description",
            ],
        }) as MergeJsonResult<DeepPartial<ChallengeEntity>>
        // deterministic parent challenge id reused by all child id factories
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
            title: merged.title ?? "",
            description: merged.description ?? "",
            difficulty: merged.difficulty ?? ChallengeDifficulty.Easy,
            score: this.coerceMdScalarService.toRequiredNumber(
                merged.score,
                0,
            ),
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
            requirements: (merged.requirements ?? []).map(({
                orderIndex,
                purpose,
                technicalConstraints,
                proTipsHints,
                forbidden,
                score,
                promptText,
                translations,
            }) => {
                const requirementId = this.challengeRequirementIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        requirementIndex: orderIndex ?? 0,
                    },
                )
                return {
                    id: requirementId,
                    orderIndex: orderIndex ?? 0,
                    purpose,
                    technicalConstraints,
                    proTipsHints,
                    forbidden,
                    promptText,
                    score: this.coerceMdScalarService.toRequiredNumber(score,
                        0),
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations: (translations ?? []).map(
                        ({
                            locale,
                            field,
                            value,
                        }) => ({
                            challengeRequirementId: requirementId,
                            locale,
                            field,
                            value,
                        }),
                    ),
                }
            }),
            outputs: (merged.outputs ?? []).map(({
                orderIndex = 0,
                text,
                translations,
            }) => {
                const outputId = this.challengeOutputIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        outputIndex: orderIndex ?? 0,
                    },
                )
                return {
                    id: outputId,
                    orderIndex,
                    text,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations: (translations ?? []).map(
                        ({
                            locale,
                            field,
                            value,
                        }) => ({
                            challengeOutputId: outputId,
                            locale,
                            field,
                            value,
                        }),
                    ),
                }
            }),
            prerequisites: (merged.prerequisites ?? []).map(({
                orderIndex = 0,
                text,
                translations,
            }) => {
                const prerequisiteId = this.challengePrerequisiteIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        prerequisiteIndex: orderIndex ?? 0,
                    },
                )
                return {
                    id: prerequisiteId,
                    orderIndex,
                    text,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations: (translations ?? []).map(
                        ({
                            locale,
                            field,
                            value,
                        }) => ({
                            challengePrerequisiteId: prerequisiteId,
                            locale,
                            field,
                            value,
                        }),
                    ),
                }
            }),
            references: (merged.references ?? []).map(({
                orderIndex = 0,
                alias,
                url,
                translations,
            }) => {
                const referenceId = this.challengeReferenceIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        referenceIndex: orderIndex ?? 0,
                    },
                )
                return {
                    id: referenceId,
                    orderIndex,
                    alias,
                    url,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations: (translations ?? []).map(
                        ({
                            locale,
                            field,
                            value,
                        }) => ({
                            challengeReferenceId: referenceId,
                            locale,
                            field,
                            value,
                        }),
                    ),
                }
            }),
            steps: (merged.steps ?? []).map(({
                orderIndex = 0,
                title,
                body,
                codeImplementations,
                translations,
            }) => {
                const stepId = this.challengeStepIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        stepIndex: orderIndex ?? 0,
                    },
                )
                // step's own title/body translations come straight from the merge
                const stepTranslations = (translations ?? []).map(
                    ({
                        locale,
                        field,
                        value,
                    }) => ({
                        challengeStepId: stepId,
                        locale,
                        field,
                        value,
                    }),
                )
                // codeImplementations are a SECOND array level the merge does not resolve, so their
                // per-locale guide/example rows are read from the extract map keyed by (step, impl)
                const codeImplementationsParsed = (
                    (
                        codeImplementations as Array<Partial<ChallengeStepCodeImplementationEntity>> | undefined
                    ) ?? []
                ).map((implementation) => {
                    const implementationOrderIndex = implementation.orderIndex ?? 0
                    const implementationId = this.challengeStepCodeImplementationIdFactoryService.generate({
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        stepIndex: orderIndex ?? 0,
                        implementationIndex: implementationOrderIndex,
                    })
                    const lang = this.coerceMdScalarService.toRequiredString(implementation.lang,
                        "text")
                    const guide = this.coerceMdScalarService.toRequiredString(implementation.guide,
                        "")
                    const example = this.coerceMdScalarService.toRequiredString(implementation.example,
                        "")
                    const implTranslations: Array<DeepPartial<ChallengeStepCodeImplementationTranslationEntity>> = []
                    for (const locale of Object.values(Locale)) {
                        const challenge = jsonMap.get(locale)
                        const localeStep = (challenge?.steps ?? []).find(
                            (step) => step.orderIndex === orderIndex,
                        )
                        const localeImplementation = (
                            localeStep?.codeImplementations as Array<Partial<ChallengeStepCodeImplementationEntity>> | undefined
                        )?.find(
                            (row) => row.orderIndex === implementationOrderIndex,
                        )
                        if (!localeImplementation) {
                            continue
                        }
                        implTranslations.push({
                            challengeStepCodeImplementationId: implementationId,
                            locale,
                            field: "guide",
                            value: this.coerceMdScalarService.toRequiredString(
                                localeImplementation.guide,
                                "",
                            ),
                        })
                        implTranslations.push({
                            challengeStepCodeImplementationId: implementationId,
                            locale,
                            field: "example",
                            value: this.coerceMdScalarService.toRequiredString(
                                localeImplementation.example,
                                "",
                            ),
                        })
                    }
                    return {
                        id: implementationId,
                        orderIndex: implementationOrderIndex,
                        lang,
                        guide,
                        example,
                        defaultLocale: Locale.En,
                        challengeStep: {
                            id: stepId,
                        },
                        translations: implTranslations,
                    }
                })
                return {
                    id: stepId,
                    orderIndex,
                    title: this.coerceMdScalarService.toRequiredString(title,
                        ""),
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    body: this.coerceMdScalarService.toRequiredString(body,
                        ""),
                    codeImplementations: codeImplementationsParsed,
                    translations: stepTranslations,
                }
            }),
            submissions: (merged.submissions ?? []).map(({
                orderIndex: submissionOrderIndex = 0,
                title,
                description,
                type,
                score,
                prompts,
                translations,
            }) => {
                const submissionId = this.challengeSubmissionIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        submissionIndex: submissionOrderIndex ?? 0,
                    },
                )
                // submission title/description translations come straight from the merge
                const submissionTranslations = (translations ?? []).map(
                    ({
                        locale,
                        field,
                        value,
                    }) => ({
                        challengeSubmissionId: submissionId,
                        locale,
                        field,
                        value,
                    }),
                )
                return {
                    id: submissionId,
                    orderIndex: submissionOrderIndex,
                    title,
                    description: this.coerceMdScalarService.toNullableStringColumn(
                        description,
                    ),
                    type: (type as SubmissionType) ?? SubmissionType.GithubUrl,
                    score: this.coerceMdScalarService.toRequiredNumber(
                        score,
                        0,
                    ),
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations: submissionTranslations,
                    // prompts are a SECOND array level the merge does not resolve → read per-locale
                    prompts: (prompts ?? []).map<DeepPartial<ChallengeSubmissionPromptEntity>>(
                        ({
                            orderIndex = 0,
                            title,
                            score,
                            promptText,
                        }) => {
                            const challengeSubmissionPromptId = this.challengeSubmissionPromptIdFactoryService.generate(
                                {
                                    courseIndex,
                                    moduleIndex,
                                    contentIndex,
                                    challengeIndex,
                                    submissionIndex: submissionOrderIndex ?? 0,
                                    promptIndex: orderIndex ?? 0,
                                },
                            )
                            const promptTranslations = Array.from(jsonMap.entries()).flatMap(
                                ([
                                    locale,
                                    challenge,
                                ]) => {
                                    const submission = (challenge.submissions ?? []).find(
                                        (submission) => submission.orderIndex === submissionOrderIndex,
                                    )
                                    const prompt = (submission?.prompts ?? []).find(
                                        (prompt) => prompt.orderIndex === orderIndex,
                                    )
                                    if (!prompt) {
                                        return []
                                    }
                                    return [
                                        {
                                            challengeSubmissionPromptId,
                                            locale,
                                            value: prompt.title ?? "",
                                            field: "title",
                                        },
                                        {
                                            challengeSubmissionPromptId,
                                            locale,
                                            value: prompt.promptText ?? "",
                                            field: "promptText",
                                        },
                                    ]
                                },
                            )
                            return {
                                id: challengeSubmissionPromptId,
                                orderIndex,
                                title,
                                score: this.coerceMdScalarService.toRequiredNumber(
                                    score,
                                    0,
                                ),
                                promptText,
                                defaultLocale: Locale.En,
                                challengeSubmission: {
                                    id: submissionId,
                                },
                                translations: promptTranslations,
                            }
                        },
                    ),
                }
            }),
        }
    }

    /**
     * Parses many challenges from the mount.
     *
     * @param contentRelativePath - Content relative path
     * @param courseIndex - Course index
     * @param moduleIndex - Module index
     * @param contentIndex - Content index
     * @returns Entities-shaped graphs for TypeORM cascade save
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
                // delegate the per-challenge build to parse(); skip + log on failure
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
