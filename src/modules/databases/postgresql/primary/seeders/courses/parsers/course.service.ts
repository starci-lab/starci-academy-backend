import type {
    CourseDataJson,
    ExtractParams,
    ExtractResult,
    ParseCourseParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    readJsonFileOrDefault,
    readMdFileOrDefault,
} from "@modules/common"
import {
    Locale,
    PricingPhase,
} from "../../../enums"
import {
    ExtractBlockService,
    ExtractBulletListItemsService,
    ExtractQnaItemsService,
    MarkdownBulletListItem,
    MarkdownQnaItem,
} from "../extracts"
import {
    CourseIdFactoryService,
    LivestreamSessionIdFactoryService,
    PrerequisiteIdFactoryService,
    PricingPhaseIdFactoryService,
    QnaIdFactoryService,
    ValuePropositionIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    CourseEntity,
    CourseTranslationEntity,
    PrerequisiteTranslationEntity,
    QnaTranslationEntity,
    ValuePropositionTranslationEntity,
} from "../../../entities"
import {
    CourseDirService
} from "../dir"

/**
 * Parses a course root (`en.md`, `vi.md`, `data.json`) under `courses/{index}-{slug}/`.
 */
@Injectable()
export class CourseParserService {
    constructor(
        private readonly extractBlockService: ExtractBlockService,
        private readonly extractBulletListItemsService: ExtractBulletListItemsService,
        private readonly extractQnaItemsService: ExtractQnaItemsService,
        private readonly courseIdFactoryService: CourseIdFactoryService,
        private readonly prerequisiteIdFactoryService: PrerequisiteIdFactoryService,
        private readonly qnaIdFactoryService: QnaIdFactoryService,
        private readonly valuePropositionIdFactoryService: ValuePropositionIdFactoryService,
        private readonly pricingPhaseIdFactoryService: PricingPhaseIdFactoryService,
        private readonly livestreamSessionIdFactoryService: LivestreamSessionIdFactoryService,
        private readonly courseDirService: CourseDirService,
    ) { }

    /**
     * Reads the same top-level markdown section in many locales.
     *
     * @param param - Heading key and both locale documents
     * @returns Trimmed section bodies per locale
     */
    private extract(
        {
            key,
            markdownMap,
        }: ExtractParams,
    ): ExtractResult {
        const result = new Map<Locale, string>()
        for (const locale of Object.values(Locale)) {
            result.set(locale,
                this.extractBlockService.extract(
                    {
                        key,
                        markdown: markdownMap.get(locale) ?? "",
                    },
                )
            )
        }
        return result
    }

    /**
     * Builds a partial course entity (pricing, lists, translations) from the mount.
     *
     * @param param - Course ordinal
     * @returns Entity-shaped graph for TypeORM cascade save
     */
    parse(
        {
            courseIndex,
        }: ParseCourseParams,
    ): DeepPartial<CourseEntity> {
        const {
            displayId,
            path,
        } = this.courseDirService.path(
            courseIndex,
        )
        const markdownMap = new Map<Locale, string>()
        for (const locale of Object.values(Locale)) {
            markdownMap.set(
                locale,
                readMdFileOrDefault(`${path}/${locale}.md`)
            )
        }
        const dataJson = readJsonFileOrDefault<CourseDataJson>(`${path}/data.json`)

        const titleMap = this.extract(
            {
                key: "Title",
                markdownMap,
            },
        )
        const descriptionMap = this.extract(
            {
                key: "Description",
                markdownMap,
            },
        )
        const prerequisitesMap = this.extract(
            {
                key: "Prerequisites",
                markdownMap,
            },
        )
        const prerequisitesItemsMap = new Map<Locale, Array<MarkdownBulletListItem>>()
        for (const locale of Object.values(Locale)) {
            prerequisitesItemsMap.set(
                locale,
                this.extractBulletListItemsService.extract(
                    prerequisitesMap.get(locale) ?? "",
                )
            )
        }

        const valuePropositionsTextMap = this.extract(
            {
                key: "Value Propositions",
                markdownMap,
            },
        )
        const valuePropositionsMap = new Map<Locale, Array<MarkdownBulletListItem>>()
        for (const locale of Object.values(Locale)) {
            valuePropositionsMap.set(
                locale,
                this.extractBulletListItemsService.extract(
                    valuePropositionsTextMap.get(locale) ?? "",
                )
            )
        }
        const qnasTextMap = this.extract(
            {
                key: "QnA",
                markdownMap,
            },
        )
        const qnasMap = new Map<Locale, Array<MarkdownQnaItem>>()
        for (const locale of Object.values(Locale)) {
            qnasMap.set(
                locale,
                this.extractQnaItemsService.extract(
                    {
                        markdown: qnasTextMap.get(locale) ?? "",
                    },
                )
            )
        }
        const courseId = this.courseIdFactoryService.generate(
            {
                courseIndex,
            },
        )
        return {
            id: courseId,
            defaultLocale: Locale.En,
            title: titleMap.get(Locale.En) ?? "",
            description: descriptionMap.get(Locale.En) ?? "",
            displayId,
            originalPrice: dataJson.originalPrice ?? 0,
            orderIndex: courseIndex,
            livestreamSessions: (
                dataJson.livestreamSessions ?? []
            ).map((livestreamSession) => {
                return {
                    id: this.livestreamSessionIdFactoryService.generate(
                        {
                            courseIndex,
                            sessionIndex: livestreamSession.orderIndex,
                        },
                    ),
                    course: {
                        id: courseId,
                    },
                    dayOfWeek: livestreamSession.dayOfWeek,
                    startTime: livestreamSession.startTime,
                    expectedEndTime: livestreamSession.expectedEndTime,
                    isOverridable: livestreamSession.isOverridable,
                    orderIndex: livestreamSession.orderIndex,
                    translations: [],
                }
            }),
            coverImageUrl: dataJson.coverImageUrl?.trim(),
            pricingPhases: (
                dataJson.pricingPhases ?? []).map(
                (phase) => {
                    return {
                        id: this.pricingPhaseIdFactoryService.generate(
                            {
                                courseIndex,
                                phaseIndex: phase.orderIndex,
                            },
                        ),
                        phase: phase.phase as PricingPhase,
                        orderIndex: phase.orderIndex,
                        price: phase.price ?? 0,
                        slotAvailable: phase.slotAvailable ?? 0,
                    }
                },
            ),
            prerequisites: (
                prerequisitesItemsMap.get(Locale.En) ?? []
            ).map(
                (
                    {
                        text,
                        orderIndex,
                    },
                ) => {
                    const prerequisiteId = this.prerequisiteIdFactoryService.generate(
                        {
                            courseIndex,
                            prerequisiteIndex: orderIndex,
                        },
                    )
                    const translations = Array.from(
                        prerequisitesItemsMap.entries())
                        .map(
                            (
                                [
                                    locale,
                                    items
                                ]
                            ) => items
                                .filter((item) => item.orderIndex === orderIndex)
                                .map<DeepPartial<PrerequisiteTranslationEntity>>(
                                    (item) => (
                                        {
                                            prerequisiteId,
                                            locale,
                                            value: item.text,
                                            field: "text",
                                        }
                                    )
                                )
                        )
                        .flat()
                    
                    return {
                        course: {
                            id: courseId,
                        },
                        id: prerequisiteId,
                        defaultLocale: Locale.En,
                        text,
                        orderIndex,
                        translations
                    }
                },
            ),
            valuePropositions: (valuePropositionsMap.get(Locale.En) ?? []).map(
                (
                    {
                        text,
                        orderIndex,
                    },
                ) => {
                    const valuePropositionId = this.valuePropositionIdFactoryService.generate(
                        {
                            courseIndex,
                            valuePropositionIndex: orderIndex,
                        },
                    )
                    const translations = Array.from(valuePropositionsMap.entries())
                        .map((
                            [
                                locale,
                                items
                            ]
                        ) => items
                            .filter((item) => item.orderIndex === orderIndex)
                            .map<DeepPartial<ValuePropositionTranslationEntity>>(
                                (item) => ({
                                    valuePropositionId,
                                    locale,
                                    value: item.text,
                                    field: "text",
                                })))
                        .flat()
                    return {
                        course: {
                            id: courseId,
                        },
                        id: valuePropositionId,
                        defaultLocale: Locale.En,
                        text,
                        orderIndex,
                        translations
                    }
                },
            ),
            qnas: (qnasMap.get(Locale.En) ?? []).map(
                (
                    {
                        question,
                        answer,
                        orderIndex,
                    },
                ) => {
                    const qnaId = this.qnaIdFactoryService.generate(
                        {
                            courseIndex,
                            qnaIndex: orderIndex,
                        },
                    )
                    const translations = Array.from(
                        qnasMap.entries())
                        .map((
                            [locale,
                                items]
                        ) => items
                            .filter((item) => item.orderIndex === orderIndex)
                            .map<Array<DeepPartial<QnaTranslationEntity>>>(
                                (item) => (
                                    [{
                                        qnaId,
                                        locale,
                                        field: "question",
                                        value: item.question,
                                    },
                                    {
                                        qnaId,
                                        locale,
                                        field: "answer",
                                        value: item.answer,
                                    }
                                    ]
                                ))
                        )
                        .flat()
                        .flat()
                    return {
                        id: qnaId,
                        defaultLocale: Locale.En,
                        question,
                        answer,
                        course: {
                            id: courseId,
                        },
                        orderIndex,
                        translations
                    }
                },
            ),
            translations: (
                () => {
                    const translations: Array<DeepPartial<CourseTranslationEntity>> = []
                    for (const locale of Object.values(Locale)) {
                        translations.push(
                            {
                                courseId,
                                locale,
                                field: "title",
                                value: titleMap.get(locale) ?? "",
                            }
                        )
                        translations.push(
                            {
                                courseId,
                                locale,
                                field: "description",
                                value: descriptionMap.get(locale) ?? "",
                            }
                        )
                    }
                    return translations
                }
            )()
        }
    }
}
