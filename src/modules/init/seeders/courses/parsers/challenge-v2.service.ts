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
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    MergeJsonService,
    MergeJsonResult,
} from "../../shared"
import {
    ChallengeIdFactoryService,
    ChallengeRequirementV2IdFactoryService,
    ChallengeStepV2IdFactoryService,
    ChallengeOutputV2IdFactoryService,
    ChallengePrerequisiteV2IdFactoryService,
    ChallengeReferenceIdFactoryService,
    ContentIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ChallengeEntity,
    ChallengeRequirementV2Entity,
    ChallengeStepV2Entity,
    ChallengeOutputV2Entity,
    ChallengePrerequisiteV2Entity,
} from "@modules/databases"
import {
    ChallengePathService,
} from "../path"
import {
    ChallengeSubmissionCriteriaParserService,
} from "./challenge-submission-criteria.service"
import {
    ChallengeSubmissionParserService,
} from "./challenge-submission.service"
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
import {
    filterLangSectionBuckets,
    findLangBucketItem,
    getLangBucketDataItems,
    readLangBucketItemScore,
    readLangBucketItemString,
} from "./utils"

/**
 * SCHEMA V2 challenge parser. Mirrors {@link ChallengeParserService} for the scalar/translation/
 * submission columns but maps `requirements` / `steps` / `outputs` / `prerequisites` into the
 * per-language bucket child tables (`*V2`) and the agnostic / per-language criteria columns
 * (`outcomeCriteria` / `approachCriteria`).
 *
 * It is ADDITIVE: the legacy {@link ChallengeParserService} is left untouched and continues to
 * handle V1 challenge files. The orchestrator routes a file here only when `# verified` parses
 * to a non-null date.
 */
@Injectable()
export class ChallengeV2ParserService {
    constructor(
        private readonly challengePathService: ChallengePathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
        private readonly challengeReferenceIdFactoryService: ChallengeReferenceIdFactoryService,
        private readonly challengeRequirementV2IdFactoryService: ChallengeRequirementV2IdFactoryService,
        private readonly challengeStepV2IdFactoryService: ChallengeStepV2IdFactoryService,
        private readonly challengeOutputV2IdFactoryService: ChallengeOutputV2IdFactoryService,
        private readonly challengePrerequisiteV2IdFactoryService: ChallengePrerequisiteV2IdFactoryService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly challengeSubmissionCriteriaParserService: ChallengeSubmissionCriteriaParserService,
        private readonly challengeSubmissionParserService: ChallengeSubmissionParserService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Maps the `# requirements` section into NORMALIZED V2 rows (no jsonb): one requirement ITEM per
     * position, with a per-locale `title` (agnostic across programming language), a per-language
     * `score`, and a per-(language × locale) `body`. Reads the existing per-language jsonb item data
     * (keys `orderIndex` / `title` / `body` / `score`); the agnostic title is taken from the first
     * language bucket of each locale.
     *
     * @param params - Per-locale extracts + ordinals + parent challenge id.
     * @returns Requirement item entity partials (with nested title translations + language rows).
     */
    private mapRequirementsV2(
        {
            jsonMap,
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
            challengeId,
        }: {
            jsonMap: Map<Locale, Partial<ChallengeEntity>>
            courseIndex: number
            moduleIndex: number
            contentIndex: number
            challengeIndex: number
            challengeId: string
        },
    ): Array<DeepPartial<ChallengeRequirementV2Entity>> {
        // the English document's language buckets drive the set of items + languages
        const enBuckets = ((jsonMap.get(Locale.En) as Record<string, unknown> | undefined)?.requirements ?? []) as Array<Record<string, unknown>>
        // item positions come from the first language bucket's jsonb item array
        const firstData = Array.isArray(enBuckets[0]?.data)
            ? (enBuckets[0].data as Array<Record<string, unknown>>)
            : []
        // read a string item field off a loosely-typed jsonb record
        const readString = (record: Record<string, unknown> | undefined, key: string): string =>
            (record && typeof record[key] === "string" ? record[key] as string : "")
        // find the item with the given orderIndex inside a bucket's jsonb data
        const findItem = (bucket: Record<string, unknown> | undefined, itemIndex: number): Record<string, unknown> | undefined =>
            (Array.isArray(bucket?.data)
                ? (bucket?.data as Array<Record<string, unknown>>).find(
                    (item) => item.orderIndex === itemIndex,
                )
                : undefined)
        return firstData.map((firstItem) => {
            // agnostic item position
            const itemIndex = typeof firstItem.orderIndex === "number" ? firstItem.orderIndex : 0
            const itemId = this.challengeRequirementV2IdFactoryService.generate({
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                langIndex: itemIndex,
            })
            // title is agnostic across language → one row per locale (from that locale's first bucket)
            const titleTranslations = Array.from(jsonMap.entries()).map(([locale,
                challenge]) => {
                const buckets = (challenge as Record<string, unknown>)?.requirements
                const firstBucket = Array.isArray(buckets) ? (buckets[0] as Record<string, unknown>) : undefined
                return {
                    challengeRequirementV2Id: itemId,
                    locale,
                    title: readString(findItem(firstBucket,
                        itemIndex),
                    "title"),
                }
            })
            // one language row per English bucket (score is non-localized; body is per locale)
            const langs = enBuckets.map((bucket, langIndex) => {
                const lang = readString(bucket,
                    "lang") || "text"
                const langId = this.challengeRequirementV2IdFactoryService.generateLang({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    itemIndex,
                    langIndex,
                })
                const enItem = findItem(bucket,
                    itemIndex)
                const score = enItem && typeof enItem.score === "number" ? enItem.score : 0
                // body differs by language AND locale → one row per locale (same language)
                const bodyTranslations = Array.from(jsonMap.entries()).map(([locale,
                    challenge]) => {
                    const buckets = (challenge as Record<string, unknown>)?.requirements
                    const localeBucket = Array.isArray(buckets)
                        ? (buckets as Array<Record<string, unknown>>).find((candidate) => candidate.lang === lang)
                        : undefined
                    return {
                        challengeRequirementV2LangId: langId,
                        locale,
                        body: readString(findItem(localeBucket,
                            itemIndex),
                        "body"),
                    }
                })
                return {
                    id: langId,
                    lang,
                    score,
                    defaultLocale: Locale.En,
                    requirementV2: {
                        id: itemId,
                    },
                    translations: bodyTranslations,
                }
            })
            return {
                id: itemId,
                orderIndex: itemIndex,
                defaultLocale: Locale.En,
                challenge: {
                    id: challengeId,
                },
                translations: titleTranslations,
                langs,
            }
        })
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
        // merge locales for the i18n the merge CAN resolve (top-level scalars + the flat `references`
        // array); the per-language jsonb bucket sections are handled by the dedicated mappers below
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: (jsonMap.get(locale) ?? {
                }) as Record<string, unknown>,
            })),
            translateFields: [
                "title",
                "description",
                "references.alias",
            ],
        }) as MergeJsonResult<DeepPartial<ChallengeEntity>>
        // deterministic parent challenge id reused by all V2 child id factories
        const challengeId = this.challengeIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
            },
        )
        const challenge: DeepPartial<ChallengeEntity> = {
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
            // `# verified` day marks this as a SCHEMA V2 challenge (null for legacy)
            verified: this.coerceMdScalarService.toNullableDate(
                (merged as Record<string, unknown>).verified,
            ),
            orderIndex: challengeIndex,
            // title + description rows come straight from the merge
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
            // V2 NORMALIZED requirements: item (order_index) → translations(title) → langs(score) → lang.translations(body)
            requirementsV2: this.mapRequirementsV2({
                jsonMap,
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                challengeId,
            }),
            // V2 NORMALIZED steps: item → translations(title) → langs → lang.translations(body)
            stepsV2: this.mapNormalizedBucketV2({
                jsonMap,
                section: "steps",
                itemFkKey: "challengeStepV2Id",
                langFkKey: "challengeStepV2LangId",
                challengeId,
                hasTitle: true,
                hasScore: false,
                generateItemId: (itemIndex) => this.challengeStepV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    langIndex: itemIndex,
                }),
                generateLangId: (itemIndex, langIndex) => this.challengeStepV2IdFactoryService.generateLang({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    itemIndex,
                    langIndex,
                }),
            }) as Array<DeepPartial<ChallengeStepV2Entity>>,
            // V2 NORMALIZED outputs: item → langs → lang.translations(body) (no title)
            outputsV2: this.mapNormalizedBucketV2({
                jsonMap,
                section: "outputs",
                itemFkKey: "challengeOutputV2Id",
                langFkKey: "challengeOutputV2LangId",
                challengeId,
                hasTitle: false,
                hasScore: false,
                generateItemId: (itemIndex) => this.challengeOutputV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    langIndex: itemIndex,
                }),
                generateLangId: (itemIndex, langIndex) => this.challengeOutputV2IdFactoryService.generateLang({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    itemIndex,
                    langIndex,
                }),
            }) as Array<DeepPartial<ChallengeOutputV2Entity>>,
            // V2 NORMALIZED prerequisites: item → langs → lang.translations(body) (no title)
            prerequisitesV2: this.mapRequirementsV2({
                jsonMap,
                section: "prerequisites",
                itemFkKey: "challengePrerequisiteV2Id",
                langFkKey: "challengePrerequisiteV2LangId",
                challengeId,
                hasTitle: false,
                hasScore: false,
                generateItemId: (itemIndex) => this.challengePrerequisiteV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    langIndex: itemIndex,
                }),
                generateLangId: (itemIndex, langIndex) => this.challengePrerequisiteV2IdFactoryService.generateLang({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    itemIndex,
                    langIndex,
                }),
            }) as Array<DeepPartial<ChallengePrerequisiteV2Entity>>,
            // agnostic outcome criteria → single jsonb column
            outcomeCriteria: this.mapCriteria(
                (jsonMap.get(Locale.En) as Record<string, unknown> | undefined)?.outcomeCriteria,
            ),
            // per-language approach criteria buckets → single jsonb column
            approachCriteria: this.mapCriteria(
                (jsonMap.get(Locale.En) as Record<string, unknown> | undefined)?.approachCriteria,
            ),
            submissions: await this.challengeSubmissionParserService.parseMany({
                challengeRelativePath: path.relativePath,
                challengeId,
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                jsonMap,
            }),
        }
        // SCHEMA V2: attach each submission's approach + outcome criteria from
        // inline `# approachCriterias` / `# outcomeCriterias` in submissions/<n>/en.md.
        for (const submission of challenge.submissions ?? []) {
            const {
                approachCriteria,
                outcomeCriteria,
                approachScore,
                outcomeScore,
            } = await this.challengeSubmissionCriteriaParserService.parse({
                challengeRelativePath: path.relativePath,
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                submissionOrderIndex: submission.orderIndex ?? 0,
                submissionId: submission.id as string,
            })
            // cascade-save these alongside the submission (rubric tables store NO per-item score)
            submission.approachCriteria = approachCriteria
            submission.outcomeCriteria = outcomeCriteria
            // the 70/30 weighting lives on the SUBMISSION (recovered from its rubric sums); the
            // submission's total score is the sum of the two rubric weights (e.g. 70 + 30 = 100)
            const resolvedApproachScore = approachScore || 70
            const resolvedOutcomeScore = outcomeScore || 30
            submission.approachScore = resolvedApproachScore
            submission.outcomeScore = resolvedOutcomeScore
            submission.score = resolvedApproachScore + resolvedOutcomeScore
        }
        return challenge
    }

    /**
     * Parses many V2 challenges from the mount. Skips any file whose `# verified` day is absent or
     * unparseable — those belong to the legacy {@link ChallengeParserService}.
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
                // detect schema from the English markdown — V2 owns files with a parseable `# verified` day
                const enMarkdown = await this.contextLoaderService.load(
                    "courses",
                    `${path.relativePath}/${Locale.En}.md`,
                )
                // not a V2 file → leave it to the legacy parser/insert
                if (!this.isV2(enMarkdown)) {
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
     * Detects whether a challenge markdown document uses SCHEMA V2. V2 files carry `# verified`
     * (e.g. `2026-05-30`); legacy files omit it or leave it empty.
     *
     * @param markdown - Raw challenge markdown (English document is enough).
     * @returns `true` when `# verified` parses to a non-null date.
     */
    isV2(markdown: string): boolean {
        const extracted = this.extractJsonFromMdService.extract<Record<string, unknown>>(markdown)
        return this.coerceMdScalarService.toNullableDate(extracted.verified) !== null
    }
}
