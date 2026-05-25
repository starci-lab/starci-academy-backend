import type {
    ParseCourseParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    PricingPhase,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    ResolvedFileResult,
} from "../../shared"
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
} from "@modules/databases"
import {
    ContextLoaderService 
} from "../../shared"
import {
    CoursePathNotFoundException,
} from "@modules/exceptions"
import {
    CoursePathService,
} from "../path"

/**
 * Parses a course root (`en.md`, `vi.md`, optional `data.json`) under `courses/{index}-{slug}/`.
 * Structured fields use camelCase `#` headings in `en.md`; `data.json` fills gaps when present.
 */
@Injectable()
export class CourseParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly courseIdFactoryService: CourseIdFactoryService,
        private readonly prerequisiteIdFactoryService: PrerequisiteIdFactoryService,
        private readonly qnaIdFactoryService: QnaIdFactoryService,
        private readonly valuePropositionIdFactoryService: ValuePropositionIdFactoryService,
        private readonly pricingPhaseIdFactoryService: PricingPhaseIdFactoryService,
        private readonly livestreamSessionIdFactoryService: LivestreamSessionIdFactoryService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly coursePathService: CoursePathService,
    ) { }

    /**
     * Builds a partial course entity (pricing, lists, translations) from the mount.
     *
     * @param param - Course ordinal
     * @returns Entity-shaped graph for TypeORM cascade save
     */
    async parse(
        {
            paths,
            courseIndex,
        }: ParseCourseParams,
    ): Promise<DeepPartial<CourseEntity>> {
        const jsonMap = new Map<Locale, Partial<CourseEntity>>()
        const path = paths.find(
            (path) => path.orderIndex === courseIndex
        )
        if (!path) {
            throw new CoursePathNotFoundException(
                {
                    courseIndex,
                },
            )
        }
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load(
                        "courses", 
                        `${path.relativePath}/${locale}.md`
                    ),
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
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: jsonMap.get(Locale.En)?.description ?? "",
            displayId: path.displayId,
            originalPrice: this.coerceMdScalarService.toRequiredNumber(
                jsonMap.get(Locale.En)?.originalPrice,
                0,
            ),
            orderIndex: courseIndex,
            livestreamSessions: (
                jsonMap.get(Locale.En)?.livestreamSessions ?? []
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
            coverImageUrl: jsonMap.get(Locale.En)?.coverImageUrl?.trim(),
            pricingPhases: (
                jsonMap.get(Locale.En)?.pricingPhases ?? []).map(
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
                        price: this.coerceMdScalarService.toNullableNumericColumn(
                            phase.price,
                        ),
                        slotAvailable: this.coerceMdScalarService.toNullableNumericColumn(
                            phase.slotAvailable,
                        ),
                    }
                },
            ),
            prerequisites: (
                jsonMap.get(Locale.En)?.prerequisites ?? []
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
                        jsonMap.entries())
                        .map(
                            (
                                [
                                    locale,
                                    course
                                ]
                            ) => (course.prerequisites ?? [])
                                .filter((prerequisite) => prerequisite.orderIndex === orderIndex)
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
            valuePropositions: (jsonMap.get(Locale.En)?.valuePropositions ?? []).map(
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
                    const translations = Array.from(jsonMap.entries())
                        .map((
                            [
                                locale,
                                course
                            ]
                        ) => (course.valuePropositions ?? [])
                            .filter((valueProposition) => valueProposition.orderIndex === orderIndex)
                            .map<DeepPartial<ValuePropositionTranslationEntity>>(
                                (valueProposition) => (
                                    {
                                        valuePropositionId,
                                        locale,
                                        value: valueProposition.text,
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
                        id: valuePropositionId,
                        defaultLocale: Locale.En,
                        text,
                        orderIndex,
                        translations
                    }
                },
            ),
            qnas: (jsonMap.get(Locale.En)?.qnas ?? []).map(
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
                        jsonMap.entries())
                        .map((
                            [locale,
                                course
                            ]
                        ) => (course.qnas ?? [])
                            .filter((qna) => qna.orderIndex === orderIndex)
                            .map<Array<DeepPartial<QnaTranslationEntity>>>(
                                (qna) => (
                                    [{
                                        qnaId,
                                        locale,
                                        field: "question",
                                        value: qna.question,
                                    },
                                    {
                                        qnaId,
                                        locale,
                                        field: "answer",
                                        value: qna.answer,
                                    }
                                    ]
                                )
                            )
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
                                value: jsonMap.get(locale)?.title ?? "",
                            }
                        )
                        translations.push(
                            {
                                courseId,
                                locale,
                                field: "description",
                                value: jsonMap.get(locale)?.description ?? "",
                            }
                        )
                    }
                    return translations
                }
            )()
        }
    }

    /**
     * Parses many courses from the mount.
     *
     * @returns Entities-shaped graphs for TypeORM cascade save
     */
    async parseMany(
    ): Promise<Array<ResolvedFileResult<DeepPartial<CourseEntity>>>> {
        const paths = await this.coursePathService.paths()
        const data: Array<ResolvedFileResult<DeepPartial<CourseEntity>>> = []
        for (const path of paths) {
            const course = await this.parse(
                {
                    paths,
                    courseIndex: path.orderIndex,
                },
            )
            data.push({
                data: course,
                index: path.orderIndex,
                relativePath: path.relativePath,
            })
        }
        return data
    }
}

