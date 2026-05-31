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
    ChallengeEntity,
    ChallengeOutputEntity,
    ChallengePrerequisiteEntity,
    ChallengeReferenceEntity,
    ChallengeRequirementEntity,
    ChallengeStepEntity,
    ChallengeSubmissionEntity,
    ChallengeSubmissionPromptEntity,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    ContextLoaderService,
    ResolvedFileResult,
    MergeJsonService,
    MergeJsonResult,
} from "../../shared"
import {
    ChallengeIdFactoryService,
    ChallengeOutputIdFactoryService,
    ChallengePrerequisiteIdFactoryService,
    ChallengeSubmissionPromptIdFactoryService,
    ChallengeRequirementIdFactoryService,
    ChallengeStepIdFactoryService,
    ChallengeSubmissionIdFactoryService,
    ChallengeReferenceIdFactoryService,
    ContentIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ChallengePathService,
} from "../path"
import {
    ChallengePathNotFoundException,
} from "@modules/exceptions"

/**
 * Legacy (V1) challenge parser for mounted course files (`en.md` / `vi.md`).
 *
 * Parses the **old** challenge markdown shape (documented in
 * `.claude/pattern/17-legacy-content-challenge-format.md`, live examples = M0 L1/L2): `# requirements`
 * (purpose / technicalConstraints / proTipsHints), `# prerequisites`, `# steps`, `# outputs`,
 * `# references`, `# submissions` (type / title / description / score + prompts), `# difficulty`,
 * `# score`.
 *
 * Follows the canonical mount-parse pattern (`.claude/pattern/16-mount-parsing.md`): extract once per
 * locale, merge via {@link MergeJsonService} with dot-path `translateFields`, then render straight
 * from `merged` — every array item already carries its aligned `translations[]`.
 *
 * Paired with {@link ChallengeParserService}: invoked from {@link ChallengeParserService.parseMany}
 * when {@link ChallengeParserService.isV2} is false.
 */
@Injectable()
export class ChallengeLegacyParserService {
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
        private readonly challengeReferenceIdFactoryService: ChallengeReferenceIdFactoryService,
        private readonly challengeRequirementIdFactoryService: ChallengeRequirementIdFactoryService,
        private readonly challengeOutputIdFactoryService: ChallengeOutputIdFactoryService,
        private readonly challengePrerequisiteIdFactoryService: ChallengePrerequisiteIdFactoryService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
    ) { }

    /**
     * Maps a markdown `type` string to a DB-safe {@link SubmissionType}.
     * Templates may use `githubRepository` / `github_repository` as synonyms for `githubUrl`.
     *
     * @param raw - The raw `type` value extracted from the submission markdown.
     * @returns The normalized submission type (defaults to `githubUrl`).
     */
    private normalizeChallengeSubmissionType(raw: unknown): SubmissionType {
        if (raw === SubmissionType.GithubUrl || raw === SubmissionType.GoogleDocsUrl) {
            return raw
        }
        if (typeof raw !== "string") {
            return SubmissionType.GithubUrl
        }
        const normalized = raw.trim()
        if (
            normalized === ""
            || normalized === SubmissionType.GithubUrl
            || normalized === "github_repository"
            || normalized === "githubRepository"
        ) {
            return SubmissionType.GithubUrl
        }
        if (
            normalized === SubmissionType.GoogleDocsUrl
            || normalized === "google_docs_url"
        ) {
            return SubmissionType.GoogleDocsUrl
        }
        return SubmissionType.GithubUrl
    }

    /**
     * Builds a partial legacy challenge entity graph from mounted course files.
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
        // extract the heading structure for every locale's markdown file
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
        // merge locales into one default-locale doc + aligned translation rows per i18n field
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: jsonMap.get(locale) ?? {
                },
            })),
            translateFields: [
                "title",
                "description",
                "requirements.purpose",
                "requirements.technicalConstraints",
                "requirements.proTipsHints",
                "requirements.forbidden",
                "prerequisites.text",
                "steps.title",
                "steps.body",
                "outputs.text",
                "references.alias",
                "references.url",
                "submissions.title",
                "submissions.description",
                "submissions.prompts.title",
                "submissions.prompts.promptText",
            ],
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
            requirements: ((merged.requirements ?? []) as Array<DeepPartial<ChallengeRequirementEntity>>).map((item) => {
                const requirementId = this.challengeRequirementIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        requirementIndex: item.orderIndex ?? 0,
                    },
                )
                return {
                    id: requirementId,
                    orderIndex: item.orderIndex,
                    purpose: this.coerceMdScalarService.toRequiredString(item.purpose,
                        ""),
                    technicalConstraints: this.coerceMdScalarService.toRequiredString(item.technicalConstraints,
                        ""),
                    proTipsHints: this.coerceMdScalarService.toRequiredString(item.proTipsHints,
                        ""),
                    forbidden: this.coerceMdScalarService.toRequiredString(item.forbidden,
                        ""),
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations: (item.translations ?? []).map(({
                        locale,
                        field,
                        value,
                    }) => ({
                        challengeRequirementId: requirementId,
                        locale,
                        field,
                        value,
                    })),
                }
            }),
            outputs: ((merged.outputs ?? []) as Array<DeepPartial<ChallengeOutputEntity>>).map((item) => {
                const outputId = this.challengeOutputIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        outputIndex: item.orderIndex ?? 0,
                    },
                )
                return {
                    id: outputId,
                    orderIndex: item.orderIndex,
                    text: this.coerceMdScalarService.toRequiredString(item.text,
                        ""),
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations: (item.translations ?? []).map(({
                        locale,
                        field,
                        value,
                    }) => ({
                        challengeOutputId: outputId,
                        locale,
                        field,
                        value,
                    })),
                }
            }),
            prerequisites: ((merged.prerequisites ?? []) as Array<DeepPartial<ChallengePrerequisiteEntity>>).map((item) => {
                const prerequisiteId = this.challengePrerequisiteIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        prerequisiteIndex: item.orderIndex ?? 0,
                    },
                )
                return {
                    id: prerequisiteId,
                    orderIndex: item.orderIndex,
                    text: this.coerceMdScalarService.toRequiredString(item.text,
                        ""),
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations: (item.translations ?? []).map(({
                        locale,
                        field,
                        value,
                    }) => ({
                        challengePrerequisiteId: prerequisiteId,
                        locale,
                        field,
                        value,
                    })),
                }
            }),
            references: ((merged.references ?? []) as Array<DeepPartial<ChallengeReferenceEntity>>).map((item) => {
                const referenceId = this.challengeReferenceIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        referenceIndex: item.orderIndex ?? 0,
                    },
                )
                return {
                    id: referenceId,
                    orderIndex: item.orderIndex,
                    alias: this.coerceMdScalarService.toRequiredString(item.alias,
                        ""),
                    url: this.coerceMdScalarService.toRequiredString(item.url,
                        ""),
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations: (item.translations ?? []).map(({
                        locale,
                        field,
                        value,
                    }) => ({
                        challengeReferenceId: referenceId,
                        locale,
                        field,
                        value,
                    })),
                }
            }),
            steps: ((merged.steps ?? []) as Array<DeepPartial<ChallengeStepEntity>>).map((item) => {
                const stepId = this.challengeStepIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        stepIndex: item.orderIndex ?? 0,
                    },
                )
                return {
                    id: stepId,
                    orderIndex: item.orderIndex,
                    title: this.coerceMdScalarService.toRequiredString(item.title,
                        ""),
                    body: this.coerceMdScalarService.toRequiredString(item.body,
                        ""),
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations: (item.translations ?? []).map(({
                        locale,
                        field,
                        value,
                    }) => ({
                        challengeStepId: stepId,
                        locale,
                        field,
                        value,
                    })),
                }
            }),
            submissions: ((merged.submissions ?? []) as Array<DeepPartial<ChallengeSubmissionEntity>>).map((submission) => {
                const submissionId = this.challengeSubmissionIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        submissionIndex: submission.orderIndex ?? 0,
                    },
                )
                return {
                    id: submissionId,
                    orderIndex: submission.orderIndex,
                    title: this.coerceMdScalarService.toRequiredString(submission.title,
                        ""),
                    description: this.coerceMdScalarService.toNullableStringColumn(
                        submission.description,
                    ),
                    type: this.normalizeChallengeSubmissionType(
                        submission.type ?? SubmissionType.GithubUrl,
                    ),
                    score: this.coerceMdScalarService.toRequiredNumber(
                        submission.score,
                        0,
                    ),
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations: (submission.translations ?? []).map(({
                        locale,
                        field,
                        value,
                    }) => ({
                        challengeSubmissionId: submissionId,
                        locale,
                        field,
                        value,
                    })),
                    prompts: ((submission.prompts ?? []) as Array<DeepPartial<ChallengeSubmissionPromptEntity>>).map((prompt) => {
                        const challengeSubmissionPromptId = this.challengeSubmissionPromptIdFactoryService.generate(
                            {
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                submissionIndex: submission.orderIndex ?? 0,
                                promptIndex: prompt.orderIndex ?? 0,
                            },
                        )
                        return {
                            id: challengeSubmissionPromptId,
                            orderIndex: prompt.orderIndex,
                            title: this.coerceMdScalarService.toRequiredString(prompt.title,
                                ""),
                            score: this.coerceMdScalarService.toRequiredNumber(
                                prompt.score,
                                0,
                            ),
                            promptText: this.coerceMdScalarService.toRequiredString(prompt.promptText,
                                ""),
                            defaultLocale: Locale.En,
                            challengeSubmission: {
                                id: submissionId,
                            },
                            translations: (prompt.translations ?? []).map(({
                                locale,
                                field,
                                value,
                            }) => ({
                                challengeSubmissionPromptId,
                                locale,
                                field,
                                value,
                            })),
                        }
                    }),
                }
            }),
        }
    }

    /**
     * Parses many legacy challenges from the mount.
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
        }
        return data
    }
}
