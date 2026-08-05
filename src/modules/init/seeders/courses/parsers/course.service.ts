import type {
    CourseFromDatabaseParams,
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
    MergeJsonService,
    ResolvedFileResult,
    ContextLoaderService,
    logInitSeederEntitySkipped,
} from "../../shared"
import type {
    MergeJsonResult,
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
    EntityManager,
} from "typeorm"
import {
    CourseEntity,
    CourseMindMapTree,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CoursePathNotFoundException,
} from "@modules/exceptions"
import {
    CoursePathService,
} from "../path"
import {
    WinstonService,
} from "@modules/winston"
import {
    S3BuildService,
    S3Provider,
} from "@modules/s3"

@Injectable()
/**
 * Parses a course root (`en.md`, `vi.md`, optional `data.json`) under `courses/{index}-{slug}/`.
 * Structured fields use camelCase `#` headings in `en.md`; `data.json` fills gaps when present.
 */
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
        private readonly mergeJsonService: MergeJsonService,
        private readonly winstonService: WinstonService,
        private readonly s3BuildService: S3BuildService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Resolve a raw `# coverImageUrl` mount value into the URL persisted to the DB.
     *
     * Absolute URLs (`http(s)://...`) are kept verbatim (legacy externally-hosted covers); anything
     * else is treated as a MinIO object key (e.g. `assets/courses/fullstack-mastery.png`, synced by
     * the assets module under the public `assets/` prefix) and expanded into a public, env-aware URL,
     * so the committed seed stays deployment-agnostic. Mirrors the foundation thumbnail resolver.
     *
     * @param value - Raw cover value from the mount, or `null`/empty when absent.
     * @returns The resolved absolute URL, or `undefined` when no cover is set.
     */
    private resolveCoverImageUrl(value: string | null | undefined): string | undefined {
        const trimmed = value?.trim()
        if (!trimmed) {
            return undefined
        }
        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed
        }
        const key = trimmed.replace(/^\/+/,
            "")
        return this.s3BuildService.buildPublicObjectUrl({
            key,
            provider: S3Provider.Minio,
        })
    }

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
        const jsonMap = new Map<Locale, DeepPartial<CourseEntity>>()
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
                ) as DeepPartial<CourseEntity>,
            )
        }
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: (jsonMap.get(locale) ?? {
                }) as Record<string, unknown>,
            })),
            translateFields: [
                "title",
                "description",
                "prerequisites.text",
                "valuePropositions.text",
                "qnas.question",
                "qnas.answer",
            ],
        }) as MergeJsonResult<DeepPartial<CourseEntity>>
        const courseId = this.courseIdFactoryService.generate(
            {
                courseIndex,
            },
        )
        // authored concept mind-map (optional sibling `mind-map.json`) — absent/invalid →
        // null, and the mind-map query falls back to a module-derived graph.
        let mindMap: CourseMindMapTree | null = null
        try {
            const raw = await this.contextLoaderService.load(
                "courses",
                `${path.relativePath}/mind-map.json`,
            )
            mindMap = raw ? (JSON.parse(raw) as CourseMindMapTree) : null
        } catch {
            mindMap = null
        }
        return {
            id: courseId,
            mindMap,
            defaultLocale: Locale.En,
            title: merged.title ?? "",
            description: merged.description ?? "",
            displayId: path.displayId,
            originalPrice: this.coerceMdScalarService.toRequiredNumber(
                merged.originalPrice,
                0,
            ),
            orderIndex: courseIndex,
            // pure display-ordering index — explicit `# sortIndex`, else falls back to orderIndex
            sortIndex: this.toSortIndex(
                (merged as { sortIndex?: unknown }).sortIndex,
                courseIndex,
            ),
            livestreamSessions: (
                merged.livestreamSessions ?? []
            ).map((livestreamSession) => {
                return {
                    id: this.livestreamSessionIdFactoryService.generate(
                        {
                            courseIndex,
                            sessionIndex: livestreamSession.orderIndex ?? 0,
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
            coverImageUrl: this.resolveCoverImageUrl(merged.coverImageUrl),
            pricingPhases: (
                merged.pricingPhases ?? []).map(
                (phase) => {
                    return {
                        id: this.pricingPhaseIdFactoryService.generate(
                            {
                                courseIndex,
                                phaseIndex: phase.orderIndex ?? 0,
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
                merged.prerequisites ?? []
            ).map(
                (
                    {
                        text,
                        orderIndex,
                        translations,
                    },
                ) => {
                    const prerequisiteId = this.prerequisiteIdFactoryService.generate(
                        {
                            courseIndex,
                            prerequisiteIndex: orderIndex ?? 0,
                        },
                    )
                    return {
                        course: {
                            id: courseId,
                        },
                        id: prerequisiteId,
                        defaultLocale: Locale.En,
                        text,
                        orderIndex,
                        translations: (translations ?? []).map(
                            ({
                                locale,
                                field,
                                value,
                            }) => ({
                                prerequisiteId,
                                locale,
                                field,
                                value,
                            }),
                        ),
                    }
                },
            ),
            valuePropositions: (merged.valuePropositions ?? []).map(
                (
                    {
                        text,
                        orderIndex,
                        translations,
                    },
                ) => {
                    const valuePropositionId = this.valuePropositionIdFactoryService.generate(
                        {
                            courseIndex,
                            valuePropositionIndex: orderIndex ?? 0,
                        },
                    )
                    return {
                        course: {
                            id: courseId,
                        },
                        id: valuePropositionId,
                        defaultLocale: Locale.En,
                        text,
                        orderIndex,
                        translations: (translations ?? []).map(
                            ({
                                locale,
                                field,
                                value,
                            }) => ({
                                valuePropositionId,
                                locale,
                                field,
                                value,
                            }),
                        ),
                    }
                },
            ),
            qnas: (merged.qnas ?? []).map(
                (
                    {
                        question,
                        answer,
                        orderIndex,
                        translations,
                    },
                ) => {
                    const qnaId = this.qnaIdFactoryService.generate(
                        {
                            courseIndex,
                            qnaIndex: orderIndex ?? 0,
                        },
                    )
                    return {
                        id: qnaId,
                        defaultLocale: Locale.En,
                        question,
                        answer,
                        course: {
                            id: courseId,
                        },
                        orderIndex,
                        translations: (translations ?? []).map(
                            ({
                                locale,
                                field,
                                value,
                            }) => ({
                                qnaId,
                                locale,
                                field,
                                value,
                            }),
                        ),
                    }
                },
            ),
            translations: (merged.translations ?? []).map(
                ({
                    locale,
                    field,
                    value,
                }) => ({
                    courseId,
                    locale,
                    field,
                    value,
                }),
            ),
        }
    }

    /**
     * Resolves the `# sortIndex` mount value (pure display order), falling back to the
     * course's `orderIndex` when it is missing or not a finite number.
     *
     * @param raw - Raw scalar read from the course mount file
     * @param fallback - The orderIndex to use when `# sortIndex` is absent
     * @returns The resolved sort index
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback
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
            try {
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
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    CourseEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }

    /**
     * Loads one persisted course row by deterministic id (DB inspection / sync checks).
     *
     * @param params - Course ordinal on the mount.
     * @returns The course row, or `null` when missing.
     */
    async courseFromDatabase(
        params: CourseFromDatabaseParams,
    ): Promise<CourseEntity | null> {
        const {
            courseIndex,
        } = params
        const courseId = this.courseIdFactoryService.generate({
            courseIndex,
        })
        return this.entityManager.findOne(CourseEntity,
            {
                where: {
                    id: courseId,
                },
            })
    }
}

