import type {
    CourseDataJson,
    ExtractCourseBlockBothParams,
    ExtractCourseBlockBothResult,
    ListCourseIndexesResult,
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
    CourseSeedPricingDataInvalidException,
    CourseSeedPrerequisiteViMissingException,
    CourseSeedQnaViMissingException,
    CourseSeedValuePropositionViMissingException,
} from "@modules/exceptions"
import {
    envConfig,
} from "@modules/env"
import {
    Locale,
    PricingPhase,
} from "../../../enums"
import {
    ExtractBlockService,
    ExtractBulletListItemsService,
    ExtractQnaItemsService,
} from "../extracts"
import {
    CourseIdFactoryService,
    PrerequisiteIdFactoryService,
    PricingPhaseIdFactoryService,
    QnaIdFactoryService,
    ValuePropositionIdFactoryService,
} from "../id-factories"
import {
    courseAlias,
} from "../utils"
import {
    ModuleParserService,
} from "./module.service"
import {
    DeepPartial,
} from "typeorm"
import {
    CourseEntity,
} from "../../../entities"
import {
    listMountedCourseIndices,
} from "./utils"

/**
 * Parses a course root (`en.md`, `vi.md`, `data.json`) and nested `modules/{index}/` trees.
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
        private readonly moduleParserService: ModuleParserService,
    ) {}

    /**
     * Extract the block both from the markdown file.
     * @param param - The key, enMarkdown, viMarkdown, and numHashs.
     * @returns The extracted block both.
     */
    private extractBlockBoth(
        {
            key,
            enMarkdown,
            viMarkdown,
            numHashs = 1,
        }: ExtractCourseBlockBothParams,
    ): ExtractCourseBlockBothResult {
        return {
            en: this.extractBlockService.extract(
                {
                    key,
                    markdown: enMarkdown,
                    numHashs,
                },
            ),
            vi: this.extractBlockService.extract(
                {
                    key,
                    markdown: viMarkdown,
                    numHashs,
                },
            ),
        }
    }

    /**
     * @param param - Course ordinal
     * @returns Path to `courses/{storageDir}/`
     */
    private path(
        {
            courseIndex,
        }: ParseCourseParams,
    ): string {
        return `${
            envConfig().mountPath.data.courses}/${courseAlias(courseIndex)}`
    }

    /**
     * Normalize the pricing phase.
     * @param courseIndex - The index of the course.
     * @param raw - The raw pricing phase.
     * @returns The normalized pricing phase.
     */
    private normalizePricingPhase(
        courseIndex: number,
        raw: string,
    ): PricingPhase {
        const compact = raw.trim().toLowerCase().replace(
            /[-_\s]/g,
            "",
        )
        if (compact === "pioneer") {
            return PricingPhase.Pioneer
        }
        if (compact === "earlybird") {
            return PricingPhase.EarlyBird
        }
        if (compact === "regular") {
            return PricingPhase.Regular
        }
        throw new CourseSeedPricingDataInvalidException(
            {
                courseIndex,
                field: "phase",
                invalidValue: raw,
            },
        )
    }

    /**
     * Builds a partial course entity (pricing, lists, translations) and nested modules from the mount.
     *
     * @param param - Course ordinal
     * @returns Entity-shaped graph for TypeORM cascade save
     */
    parse(
        {
            courseIndex,
        }: ParseCourseParams,
    ): DeepPartial<CourseEntity> {
        const path = this.path(
            {
                courseIndex,
            },
        )
        const storageName = courseAlias(courseIndex)

        const enMarkdown = readMdFileOrDefault(`${path}/en.md`)
        const viMarkdown = readMdFileOrDefault(`${path}/vi.md`)
        const dataJson = readJsonFileOrDefault<CourseDataJson>(`${path}/data.json`)

        const title = this.extractBlockBoth(
            {
                key: "Title",
                enMarkdown,
                viMarkdown,
            },
        )
        const description = this.extractBlockBoth(
            {
                key: "Description",
                enMarkdown,
                viMarkdown,
            },
        )

        const prerequisitesText = this.extractBlockBoth(
            {
                key: "Prerequisites",
                enMarkdown,
                viMarkdown,
            },
        )
        const enPrerequisites = this.extractBulletListItemsService.extract(
            prerequisitesText.en,
        )
        const viPrerequisites = this.extractBulletListItemsService.extract(
            prerequisitesText.vi,
        )

        const valuePropsText = this.extractBlockBoth(
            {
                key: "Value Propositions",
                enMarkdown,
                viMarkdown,
            },
        )
        const enValueProps = this.extractBulletListItemsService.extract(
            valuePropsText.en,
        )
        const viValueProps = this.extractBulletListItemsService.extract(
            valuePropsText.vi,
        )

        const enQnas = this.extractQnaItemsService.extract(
            {
                markdown: enMarkdown,
            },
        )
        const viQnas = this.extractQnaItemsService.extract(
            {
                markdown: viMarkdown,
            },
        )

        const courseId = this.courseIdFactoryService.generate(
            {
                courseIndex,
            },
        )

        return {
            id: courseId,
            defaultLocale: Locale.En,
            title: title.en,
            description: description.en,
            displayId: storageName,
            slug: storageName,
            originalPrice: dataJson.originalPrice ?? 0,
            currentPhase: this.normalizePricingPhase(courseIndex,
                dataJson.currentPhase ?? PricingPhase.Regular),
            pricingPhases: dataJson.pricingPhases.map(
                (phase) => {
                    return {
                        id: this.pricingPhaseIdFactoryService.generate(
                            {
                                courseIndex,
                                phaseIndex: phase.orderIndex,
                            },
                        ),
                        phase: this.normalizePricingPhase(courseIndex,
                            phase.phase),
                        orderIndex: phase.orderIndex,
                        price: phase.price ?? 0,
                        slotAvailable: phase.slotAvailable ?? 0,
                    }
                },
            ),
            prerequisites: enPrerequisites.map(
                (
                    {
                        text,
                        orderIndex,
                    },
                ) => {
                    const viItem = viPrerequisites.find(
                        (item) => item.orderIndex === orderIndex,
                    )
                    if (!viItem) {
                        throw new CourseSeedPrerequisiteViMissingException(
                            {
                                courseIndex,
                                orderIndex,
                            },
                        )
                    }
                    const prerequisiteId = this.prerequisiteIdFactoryService.generate(
                        {
                            courseIndex,
                            prerequisiteIndex: orderIndex,
                        },
                    )
                    return {
                        id: prerequisiteId,
                        defaultLocale: Locale.En,
                        content: text,
                        orderIndex,
                        translations: [
                            {
                                prerequisiteId,
                                locale: Locale.Vi,
                                field: "content",
                                value: viItem.text,
                            },
                        ],
                    }
                },
            ),
            valuePropositions: enValueProps.map(
                (
                    {
                        text,
                        orderIndex,
                    },
                ) => {
                    const viItem = viValueProps.find(
                        (item) => item.orderIndex === orderIndex,
                    )
                    if (!viItem) {
                        throw new CourseSeedValuePropositionViMissingException(
                            {
                                courseIndex,
                                orderIndex,
                            },
                        )
                    }
                    const valuePropositionId = this.valuePropositionIdFactoryService.generate(
                        {
                            courseIndex,
                            valuePropositionIndex: orderIndex,
                        },
                    )
                    return {
                        id: valuePropositionId,
                        defaultLocale: Locale.En,
                        content: text,
                        orderIndex,
                        translations: [
                            {
                                valuePropositionId,
                                locale: Locale.Vi,
                                field: "content",
                                value: viItem.text,
                            },
                        ],
                    }
                },
            ),
            qnas: enQnas.map(
                (
                    enItem,
                    qnaIndex,
                ) => {
                    const viItem = viQnas.find(
                        (item) => item.orderIndex === enItem.orderIndex,
                    )
                    if (!viItem) {
                        throw new CourseSeedQnaViMissingException(
                            {
                                courseIndex,
                                orderIndex: enItem.orderIndex,
                            },
                        )
                    }
                    const qnaId = this.qnaIdFactoryService.generate(
                        {
                            courseIndex,
                            qnaIndex,
                        },
                    )
                    return {
                        id: qnaId,
                        defaultLocale: Locale.En,
                        question: enItem.question,
                        answer: enItem.answer,
                        orderIndex: enItem.orderIndex,
                        translations: [
                            {
                                qnaId,
                                locale: Locale.Vi,
                                field: "question",
                                value: viItem.question,
                            },
                            {
                                qnaId,
                                locale: Locale.Vi,
                                field: "answer",
                                value: viItem.answer,
                            },
                        ],
                    }
                },
            ),
            translations: [
                {
                    courseId,
                    locale: Locale.Vi,
                    field: "title",
                    value: title.vi,
                },
                {
                    courseId,
                    locale: Locale.Vi,
                    field: "description",
                    value: description.vi,
                },
            ],
        }
    }

    /**
     * Lists course ordinals whose mount folders exist (slug names via {@link courseAlias}).
     *
     * @returns Sorted course indices
     */
    indexes(): ListCourseIndexesResult {
        return listMountedCourseIndices(
            envConfig().mountPath.data.courses,
        )
    }
}
