import type {
    MapChallengeLangSectionV2Params,
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
    ResolvedFileResult,
    ContextLoaderService,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    ChallengeIdFactoryService,
    ChallengeOutputV2IdFactoryService,
    ChallengePrerequisiteV2IdFactoryService,
    ChallengeRequirementV2IdFactoryService,
    ChallengeStepV2IdFactoryService,
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
 * SCHEMA V2 challenge parser for mounted course files (`en.md`, `vi.md`).
 * Per-locale extract → {@link MergeJsonService} for scalars; lang-bucket sections
 * (`requirements` / `steps` / `outputs` / `prerequisites`) map to `*V2` child tables;
 * submissions load from `submissions/<n>/` via {@link ChallengeSubmissionParserService}.
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
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly challengeSubmissionCriteriaParserService: ChallengeSubmissionCriteriaParserService,
        private readonly challengeSubmissionParserService: ChallengeSubmissionParserService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Maps one mount lang-bucket section into normalized V2 rows: one ITEM per `#### N` position,
     * optional agnostic `title` (per-locale), per-programming-language rows, and per-(lang × locale)
     * `body` translations. Reads flat `### data` delimiter blocks from extract.
     */
    private mapLangSectionV2(
        {
            jsonMap,
            section,
            challengeId,
            hasTitle,
            hasScore,
            titleTranslationParentIdKey,
            langTranslationParentIdKey,
            langItemRelationKey,
            generateItemId,
            generateLangId,
        }: MapChallengeLangSectionV2Params,
    ): Array<Record<string, unknown>> {
        const enBuckets = filterLangSectionBuckets(
            (jsonMap.get(Locale.En) ?? {
            })[section],
        )
        const firstData = getLangBucketDataItems(enBuckets[0])
        return firstData.map((firstItem) => {
            const itemIndex = typeof firstItem.orderIndex === "number" ? firstItem.orderIndex : 0
            const itemId = generateItemId(itemIndex)
            const titleTranslations = hasTitle
                ? Array.from(jsonMap.entries()).map(([
                    locale,
                    challenge,
                ]) => {
                    const buckets = filterLangSectionBuckets(challenge[section])
                    const firstBucket = buckets[0]
                    return {
                        [titleTranslationParentIdKey]: itemId,
                        locale,
                        title: readLangBucketItemString(
                            findLangBucketItem(firstBucket,
                                itemIndex),
                            "title",
                        ),
                    }
                })
                : undefined
            const langs = enBuckets.map((bucket, langOrderIndex) => {
                const lang = typeof bucket.lang === "string" ? bucket.lang : "text"
                const langId = generateLangId(itemIndex,
                    langOrderIndex)
                const enItem = findLangBucketItem(bucket,
                    itemIndex)
                const bodyTranslations = Array.from(jsonMap.entries()).map(([
                    locale,
                    challenge,
                ]) => {
                    const localeBucket = filterLangSectionBuckets(challenge[section])
                        .find((candidate) => candidate.lang === lang)
                    return {
                        [langTranslationParentIdKey]: langId,
                        locale,
                        body: readLangBucketItemString(
                            findLangBucketItem(localeBucket,
                                itemIndex),
                            "body",
                        ),
                    }
                })
                return {
                    id: langId,
                    lang,
                    ...(hasScore
                        ? {
                            score: readLangBucketItemScore(
                                enItem,
                                (value, fallback) => this.coerceMdScalarService.toRequiredNumber(
                                    value,
                                    fallback,
                                ),
                            ),
                        }
                        : {
                        }),
                    defaultLocale: Locale.En,
                    [langItemRelationKey]: {
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
                ...(titleTranslations
                    ? {
                        translations: titleTranslations,
                    }
                    : {
                    }),
                langs,
            }
        })
    }

    /**
     * @param markdown - Raw challenge markdown (English document is enough).
     * @returns `true` when `# verified` parses to a non-null date.
     */
    isV2(markdown: string): boolean {
        const extracted = this.extractJsonFromMdService.extract<Record<string, unknown>>(markdown)
        return this.coerceMdScalarService.toNullableDate(extracted.verified) !== null
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
                "submissions.title",
                "submissions.description",
            ],
        }) as MergeJsonResult<Record<string, unknown>>
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
            requirementsV2: this.mapLangSectionV2({
                jsonMap,
                section: "requirements",
                challengeId,
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                hasTitle: true,
                hasScore: true,
                titleTranslationParentIdKey: "challengeRequirementV2Id",
                langTranslationParentIdKey: "challengeRequirementV2LangId",
                langItemRelationKey: "requirementV2",
                generateItemId: (itemIndex) => this.challengeRequirementV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    langIndex: itemIndex,
                }),
                generateLangId: (itemIndex, langOrderIndex) => this.challengeRequirementV2IdFactoryService.generateLang({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    itemIndex,
                    langIndex: langOrderIndex,
                }),
            }) as Array<DeepPartial<ChallengeRequirementV2Entity>>,
            stepsV2: this.mapLangSectionV2({
                jsonMap,
                section: "steps",
                challengeId,
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                hasTitle: true,
                hasScore: false,
                titleTranslationParentIdKey: "challengeStepV2Id",
                langTranslationParentIdKey: "challengeStepV2LangId",
                langItemRelationKey: "stepV2",
                generateItemId: (itemIndex) => this.challengeStepV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    langIndex: itemIndex,
                }),
                generateLangId: (itemIndex, langOrderIndex) => this.challengeStepV2IdFactoryService.generateLang({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    itemIndex,
                    langIndex: langOrderIndex,
                }),
            }) as Array<DeepPartial<ChallengeStepV2Entity>>,
            outputsV2: this.mapLangSectionV2({
                jsonMap,
                section: "outputs",
                challengeId,
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                hasTitle: false,
                hasScore: false,
                titleTranslationParentIdKey: "challengeOutputV2Id",
                langTranslationParentIdKey: "challengeOutputV2LangId",
                langItemRelationKey: "outputV2",
                generateItemId: (itemIndex) => this.challengeOutputV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    langIndex: itemIndex,
                }),
                generateLangId: (itemIndex, langOrderIndex) => this.challengeOutputV2IdFactoryService.generateLang({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    itemIndex,
                    langIndex: langOrderIndex,
                }),
            }) as Array<DeepPartial<ChallengeOutputV2Entity>>,
            prerequisitesV2: this.mapLangSectionV2({
                jsonMap,
                section: "prerequisites",
                challengeId,
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                hasTitle: false,
                hasScore: false,
                titleTranslationParentIdKey: "challengePrerequisiteV2Id",
                langTranslationParentIdKey: "challengePrerequisiteV2LangId",
                langItemRelationKey: "prerequisiteV2",
                generateItemId: (itemIndex) => this.challengePrerequisiteV2IdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    langIndex: itemIndex,
                }),
                generateLangId: (itemIndex, langOrderIndex) => this.challengePrerequisiteV2IdFactoryService.generateLang({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex,
                    itemIndex,
                    langIndex: langOrderIndex,
                }),
            }) as Array<DeepPartial<ChallengePrerequisiteV2Entity>>,
            submissions: await this.challengeSubmissionParserService.parseMany({
                challengeRelativePath: path.relativePath,
                challengeId,
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                jsonMap: jsonMap as Map<Locale, Partial<ChallengeEntity>>,
            }),
        }
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
            submission.approachCriteria = approachCriteria
            submission.outcomeCriteria = outcomeCriteria
            const resolvedApproachScore = approachScore || 70
            const resolvedOutcomeScore = outcomeScore || 30
            submission.approachScore = resolvedApproachScore
            submission.outcomeScore = resolvedOutcomeScore
            submission.score = resolvedApproachScore + resolvedOutcomeScore
        }
        return challenge
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
                const enMarkdown = await this.contextLoaderService.load(
                    "courses",
                    `${path.relativePath}/${Locale.En}.md`,
                )
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
}
