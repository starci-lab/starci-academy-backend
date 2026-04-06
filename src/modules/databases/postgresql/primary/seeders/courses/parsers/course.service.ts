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
    QnaTranslationEntity,
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
                key: "Q&A",
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
        const defaultLocale = Locale.En
        return {
            id: courseId,
            defaultLocale,
            title: titleMap.get(defaultLocale) ?? "",
            description: descriptionMap.get(defaultLocale) ?? "",
            displayId,
            originalPrice: dataJson.originalPrice ?? 0,
            orderIndex: courseIndex,
            coverImageUrl: dataJson.coverImageUrl?.trim(),
            pricingPhases: (dataJson.pricingPhases ?? []).map(
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
            prerequisites: (prerequisitesItemsMap.get(Locale.En) ?? []).map(
                (
                    {
                        text,
                        orderIndex,
                    },
                ) => {
                    const translations = Array.from(
                        prerequisitesItemsMap.entries()
                    ).map((
                        [
                            locale,
                            items
                        ]
                    ) => items.map((item) => ({
                        locale,
                        text: item.text,
                        orderIndex: item.orderIndex,
                        field: "text",
                    }))).flat()
                    const prerequisiteId = this.prerequisiteIdFactoryService.generate(
                        {
                            courseIndex,
                            prerequisiteIndex: orderIndex,
                        },
                    )
                    return {
                        id: prerequisiteId,
                        defaultLocale,
                        text,
                        orderIndex,
                        translations: translations.map(
                            (translation) => {
                                return {
                                    prerequisiteId,
                                    locale: translation.locale,
                                    field: translation.field,
                                    value: translation.text,
                                }
                            },
                        ),
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
                    const translations = Array.from(valuePropositionsMap.entries()).map(([locale,
                        items]) => items.map((item) => ({
                        locale,
                        text: item.text,
                        orderIndex: item.orderIndex,
                        field: "text",
                    }))).flat()
                    const valuePropositionId = this.valuePropositionIdFactoryService.generate(
                        {
                            courseIndex,
                            valuePropositionIndex: orderIndex,
                        },
                    )
                    return {
                        id: valuePropositionId,
                        defaultLocale,
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
                    const translations = Array.from(
                        qnasMap.entries()).map((
                        [locale,
                            items]
                    ) => items.map((item) => {
                        const translations: Array<DeepPartial<QnaTranslationEntity>> = []
                        translations.push({
                            qnaId,
                            locale,
                            field: "question",
                            value: item.question,
                        })
                        translations.push({
                            qnaId,
                            locale,
                            field: "answer",
                            value: item.answer,
                        })
                        return translations
                    })).flat().flat()
                    const qnaId = this.qnaIdFactoryService.generate(
                        {
                            courseIndex,
                            qnaIndex: orderIndex,
                        },
                    )
                    return {
                        id: qnaId,
                        defaultLocale,
                        question,
                        answer,
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
