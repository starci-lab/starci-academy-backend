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
} from "../../shared"
import {
    ChallengeIdFactoryService,
    ChallengeSubmissionPromptIdFactoryService,
    ChallengeRequirementV2IdFactoryService,
    ChallengeStepV2IdFactoryService,
    ChallengeOutputV2IdFactoryService,
    ChallengePrerequisiteV2IdFactoryService,
    ChallengeSubmissionIdFactoryService,
    ChallengeReferenceIdFactoryService,
    ContentIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ChallengeEntity,
    ChallengeReferenceTranslationEntity,
    ChallengeRequirementV2Entity,
    ChallengeStepV2Entity,
    ChallengeOutputV2Entity,
    ChallengePrerequisiteV2Entity,
    ChallengeSubmissionPromptEntity,
    ChallengeSubmissionTranslationEntity,
    ChallengeTranslationEntity,
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
 * SCHEMA V2 challenge parser. Mirrors {@link ChallengeParserService} for the scalar/translation/
 * submission columns but maps `requirements` / `steps` / `outputs` / `prerequisites` into the
 * per-language jsonb bucket child tables (`*V2`) and the agnostic / per-language criteria columns
 * (`outcomeCriteria` / `approachCriteria`).
 *
 * It is ADDITIVE: the legacy {@link ChallengeParserService} is left untouched and continues to
 * handle V1 challenge files. The orchestrator routes a file here only when it contains the V2
 * marker heading `# approachCriteria`.
 */
@Injectable()
export class ChallengeV2ParserService {
    constructor(
        private readonly challengePathService: ChallengePathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
        private readonly challengeSubmissionPromptIdFactoryService: ChallengeSubmissionPromptIdFactoryService,
        private readonly challengeSubmissionIdFactoryService: ChallengeSubmissionIdFactoryService,
        private readonly challengeReferenceIdFactoryService: ChallengeReferenceIdFactoryService,
        private readonly challengeRequirementV2IdFactoryService: ChallengeRequirementV2IdFactoryService,
        private readonly challengeStepV2IdFactoryService: ChallengeStepV2IdFactoryService,
        private readonly challengeOutputV2IdFactoryService: ChallengeOutputV2IdFactoryService,
        private readonly challengePrerequisiteV2IdFactoryService: ChallengePrerequisiteV2IdFactoryService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Maps the per-programming-language jsonb buckets (`{ orderIndex, lang, data }`) of a section
     * into V2 child entity partials. One row per programming language (keyed by
     * `langIndex === bucket.orderIndex`); the row's `data` holds the default (English) locale and
     * a `translations` row is emitted for every locale that defines the matching bucket — mirroring
     * the legacy default-value-plus-translation-table pattern.
     *
     * @param jsonMap - Per-locale extracted challenge structures (vi + en).
     * @param section - Section key to read (`requirements` | `steps` | `outputs` | `prerequisites`).
     * @param challengeId - Parent challenge id used for the FK relation object.
     * @param generateId - V2 id-factory `generate` bound to the current challenge indices.
     * @param translationFkKey - Translation entity FK column pointing back at the bucket row.
     * @returns Array of V2 entity partials (with nested translations) ready for cascade upsert.
     */
    private mapPerLanguageBuckets<TEntity extends {
        id: string
        lang: string
        orderIndex: number
        data: Array<Record<string, unknown>> | null
        defaultLocale: Locale
        challenge: { id: string }
    }>(
        jsonMap: Map<Locale, Partial<ChallengeEntity>>,
        section: "requirements" | "steps" | "outputs" | "prerequisites",
        challengeId: string,
        generateId: (langIndex: number) => string,
        translationFkKey: string,
    ): Array<DeepPartial<TEntity>> {
        // the default (English) document drives the set of programming-language buckets
        const defaultBuckets = (jsonMap.get(Locale.En) as Record<string, unknown> | undefined)?.[section]
        // absent section yields no rows
        if (!Array.isArray(defaultBuckets)) {
            return []
        }
        return defaultBuckets.map((bucket, index) => {
            // each bucket is the `{ orderIndex, lang, data }` object emitted per language section
            const record = (bucket ?? {
            }) as Record<string, unknown>
            // orderIndex doubles as the langIndex used to derive the deterministic row id
            const orderIndex = typeof record.orderIndex === "number"
                ? record.orderIndex
                : index
            // language label of the bucket; fall back to a neutral marker when missing
            const lang = typeof record.lang === "string"
                ? record.lang
                : "text"
            // default-locale jsonb payload (English); keep as-is or null when missing
            const data = Array.isArray(record.data)
                ? (record.data as Array<Record<string, unknown>>)
                : null
            // deterministic id derived from challenge id + language bucket index
            const id = generateId(orderIndex)
            // one translation row per locale, matched to this bucket by its orderIndex
            const translations = Array.from(jsonMap.entries()).map(
                ([
                    locale,
                    challenge,
                ]) => {
                    const localeBuckets = (challenge as Record<string, unknown>)?.[section]
                    // find the same programming-language bucket in this locale's document
                    const localeBucket = Array.isArray(localeBuckets)
                        ? (localeBuckets as Array<Record<string, unknown>>).find(
                            (candidate) => (
                                typeof candidate?.orderIndex === "number"
                                    ? candidate.orderIndex
                                    : -1
                            ) === orderIndex,
                        )
                        : undefined
                    return {
                        [translationFkKey]: id,
                        locale,
                        data: Array.isArray(localeBucket?.data)
                            ? (localeBucket?.data as Array<Record<string, unknown>>)
                            : null,
                    }
                },
            )
            return {
                id,
                lang,
                orderIndex,
                data,
                defaultLocale: Locale.En,
                // re-attach the FK relation so TypeORM persists challenge_id
                challenge: {
                    id: challengeId,
                },
                translations,
            } as unknown as DeepPartial<TEntity>
        })
    }

    /**
     * Coerces an agnostic criteria section (`outcomeCriteria`) or per-language criteria buckets
     * (`approachCriteria`) into the jsonb column shape (`Array<Record<string, unknown>> | null`).
     *
     * @param value - Raw extracted section value.
     * @returns Normalized jsonb array, or `null` when the section is absent.
     */
    private mapCriteria(
        value: unknown,
    ): Array<Record<string, unknown>> | null {
        // empty / non-array sections collapse to a NULL jsonb column
        if (!Array.isArray(value) || value.length === 0) {
            return null
        }
        return value as Array<Record<string, unknown>>
    }

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
        // locate the folder for this challenge ordinal
        const path = paths.find(
            (path) => path.orderIndex === challengeIndex
        )
        if (!path) {
            throw new ChallengePathNotFoundException(
                {
                    challengeIndex,
                },
            )
        }
        // extract the jsonb-aware structure for every locale's markdown file
        const jsonMap = new Map<Locale, Partial<ChallengeEntity>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load("courses",
                        `${path.relativePath}/${locale}.md`),
                ),
            )
        }
        // deterministic parent challenge id reused by all V2 child id factories
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
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: jsonMap.get(Locale.En)?.description ?? "",
            difficulty: jsonMap.get(Locale.En)?.difficulty ?? ChallengeDifficulty.Easy,
            score: this.coerceMdScalarService.toRequiredNumber(
                jsonMap.get(Locale.En)?.score,
                0,
            ),
            // `# verified` day marks this as a SCHEMA V2 challenge (null for legacy)
            verified: this.coerceMdScalarService.toNullableDate(
                (jsonMap.get(Locale.En) as Record<string, unknown> | undefined)?.verified,
            ),
            orderIndex: challengeIndex,
            translations: (() => {
                // title + description rows for every locale (mirrors legacy scalar i18n)
                const translations: Array<DeepPartial<ChallengeTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        challengeId,
                        locale,
                        field: "title",
                        value: jsonMap.get(locale)?.title ?? "",
                    })
                    translations.push({
                        challengeId,
                        locale,
                        field: "description",
                        value: jsonMap.get(locale)?.description ?? "",
                    })
                }
                return translations
            })(),
            // V2 per-language requirement buckets (default-locale jsonb data + per-locale translations)
            requirementsV2: this.mapPerLanguageBuckets<ChallengeRequirementV2Entity>(
                jsonMap,
                "requirements",
                challengeId,
                (langIndex) => this.challengeRequirementV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    langIndex,
                }),
                "challengeRequirementV2Id",
            ),
            // V2 per-language step buckets
            stepsV2: this.mapPerLanguageBuckets<ChallengeStepV2Entity>(
                jsonMap,
                "steps",
                challengeId,
                (langIndex) => this.challengeStepV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    langIndex,
                }),
                "challengeStepV2Id",
            ),
            // V2 per-language output buckets
            outputsV2: this.mapPerLanguageBuckets<ChallengeOutputV2Entity>(
                jsonMap,
                "outputs",
                challengeId,
                (langIndex) => this.challengeOutputV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    langIndex,
                }),
                "challengeOutputV2Id",
            ),
            // V2 per-language prerequisite buckets
            prerequisitesV2: this.mapPerLanguageBuckets<ChallengePrerequisiteV2Entity>(
                jsonMap,
                "prerequisites",
                challengeId,
                (langIndex) => this.challengePrerequisiteV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    langIndex,
                }),
                "challengePrerequisiteV2Id",
            ),
            // agnostic outcome criteria → single jsonb column
            outcomeCriteria: this.mapCriteria(
                (jsonMap.get(Locale.En) as Record<string, unknown> | undefined)?.outcomeCriteria,
            ),
            // per-language approach criteria buckets → single jsonb column
            approachCriteria: this.mapCriteria(
                (jsonMap.get(Locale.En) as Record<string, unknown> | undefined)?.approachCriteria,
            ),
            references: (
                jsonMap.get(Locale.En)?.references ?? []
            ).map(({
                orderIndex,
                alias,
                url,
            }) => {
                // deterministic reference id per challenge + reference ordinal
                const referenceId = this.challengeReferenceIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        referenceIndex: orderIndex,
                    },
                )
                // alias translations for every locale that defines this reference
                const translations = Array.from(jsonMap.entries()).map(
                    ([
                        locale,
                        challenge,
                    ]) => (challenge.references ?? [])
                        .filter((reference) => reference.orderIndex === orderIndex)
                        .map<DeepPartial<ChallengeReferenceTranslationEntity>>(
                            (reference) => ({
                                challengeReferenceId: referenceId,
                                locale,
                                field: "alias",
                                value: reference.alias ?? "",
                            }),
                        )
                ).flat()
                return {
                    id: referenceId,
                    orderIndex,
                    alias,
                    url,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations,
                }
            }),
            submissions: (
                jsonMap.get(Locale.En)?.submissions ?? []
            ).map(({
                orderIndex: submissionOrderIndex,
                title,
                description,
                type,
                score,
                prompts,
            }) => {
                // deterministic submission id per challenge + submission ordinal
                const submissionId = this.challengeSubmissionIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        submissionIndex: submissionOrderIndex,
                    },
                )
                // title + description translations for every locale
                const translations = Array.from(jsonMap.entries()).map(
                    ([
                        locale,
                        challenge,
                    ]) => (challenge.submissions ?? [])
                        .filter((submission) => submission.orderIndex === submissionOrderIndex)
                        .map<Array<DeepPartial<ChallengeSubmissionTranslationEntity>>>(
                            (submission) => [
                                {
                                    challengeSubmissionId: submissionId,
                                    locale,
                                    value: submission.title ?? "",
                                    field: "title",
                                },
                                {
                                    challengeSubmissionId: submissionId,
                                    locale,
                                    value: submission.description ?? "",
                                    field: "description",
                                },
                            ],
                        )
                ).flat().flat()
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
                    translations,
                    prompts: (prompts ?? []).map<DeepPartial<ChallengeSubmissionPromptEntity>>(
                        ({
                            orderIndex,
                            title,
                            score,
                            promptText,
                        }) => {
                            // deterministic prompt id per submission + prompt ordinal
                            const challengeSubmissionPromptId = this.challengeSubmissionPromptIdFactoryService.generate(
                                {
                                    courseIndex,
                                    moduleIndex,
                                    contentIndex,
                                    challengeIndex,
                                    submissionIndex: submissionOrderIndex,
                                    promptIndex: orderIndex,
                                },
                            )
                            // title + promptText translations for every locale
                            const translations = Array.from(jsonMap.entries()).map(
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
                                    // skip locales that don't define this prompt
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
                            ).flat()
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
                                translations,
                            }
                        }
                    ),
                }
            }),
        }
    }

    /**
     * Parses many V2 challenges from the mount. Skips any file that does NOT carry the V2 marker
     * heading `# approachCriteria` — those belong to the legacy {@link ChallengeParserService}.
     *
     * @param contentRelativePath - Content relative path
     * @param courseIndex - Course index
     * @param moduleIndex - Module index
     * @param contentIndex - Content index
     * @returns Entity-shaped V2 graphs for the V2 insert service
     */
    async parseMany(
        {
            contentRelativePath,
            courseIndex,
            moduleIndex,
            contentIndex,
        }: ParseChallengeManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<ChallengeEntity>>>> {
        // list every challenge folder under this content
        const paths = await this.challengePathService.paths(
            {
                contentRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<ChallengeEntity>>> = []
        for (const path of paths) {
            try {
                // detect schema from the English markdown — V2 owns files with `# approachCriteria`
                const enMarkdown = await this.contextLoaderService.load(
                    "courses",
                    `${path.relativePath}/${Locale.En}.md`,
                )
                // not a V2 file → leave it to the legacy parser/insert
                if (!ChallengeV2ParserService.isV2Markdown(enMarkdown)) {
                    continue
                }
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

    /**
     * Detects whether a challenge markdown document uses SCHEMA V2. V2 files carry the H1 heading
     * `# approachCriteria`, which the legacy schema never emits — so it doubles as the routing flag.
     *
     * @param markdown - Raw challenge markdown (English document is enough).
     * @returns `true` when the document is a V2 challenge.
     */
    static isV2Markdown(markdown: string): boolean {
        // match a top-level `# approachCriteria` heading anywhere in the document
        return /^#\s+approachCriteria\s*$/m.test(markdown)
    }
}
