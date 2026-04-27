import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    LessonVideoEntity,
    ModuleEntity,
    EnrollmentEntity,
    UserEntity,
} from "@modules/databases"
import type {
    estypes,
} from "@elastic/elasticsearch"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    ILike,
    In,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    GlobalSearchQuery,
} from "./global-search.query"
import type {
    GlobalSearchItem,
    GlobalSearchSocketIoMessage,
    SearchableEntity,
} from "./types"
import {
    DEFAULT_SIZE,
    TITLE_FIELD,
    DESCRIPTION_FIELD,
} from "./constants"

const DEFAULT_LOCALE = "en"
/**
 * Handler that performs fuzzy search across multiple Elasticsearch indices
 * (contents, challenges, courses, lesson-videos) and merges results by score.
 */
@QueryHandler(GlobalSearchQuery)
@Injectable()
export class GlobalSearchHandler
    extends ICQRSHandler<GlobalSearchQuery, GlobalSearchSocketIoMessage>
    implements IQueryHandler<GlobalSearchQuery, GlobalSearchSocketIoMessage> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }
    
    protected override async process(
        query: GlobalSearchQuery,
    ): Promise<GlobalSearchSocketIoMessage> {
        const { payload, client } = query.params
        const {
            data: {
                query: termRaw,
                entities,
                size = DEFAULT_SIZE,   
            },
            locale
        } = payload
        const resolvedLocale = locale ?? DEFAULT_LOCALE
        // sanitize input
        const term = termRaw?.trim() ?? ""
        if (term.length === 0) {
            return {
                courses: [],
                modules: [],
                challenges: [],
                lessonVideos: [],
                contents: [],
            }
        }
        // only search inside courses that the user enrolled in
        const keycloakId = client.data?.userId
        if (!keycloakId) {
            return {
                courses: [],
                modules: [],
                challenges: [],
                lessonVideos: [],
                contents: [],
            }
        }

        const user = await this.entityManager.findOne(
            UserEntity,
            {
                select: {
                    id: true,
                },
                where: {
                    keycloakId,
                },
            },
        )
        if (!user?.id) {
            return {
                courses: [],
                modules: [],
                challenges: [],
                lessonVideos: [],
                contents: [],
            }
        }

        // resolve enrolled course ids
        const enrollments = await this.entityManager.find(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
            },
        )
        const courseIds = enrollments
            .map((enrollment) => enrollment.courseId)
            .filter(Boolean)

        if (courseIds.length === 0) {
            return {
                courses: [],
                modules: [],
                challenges: [],
                lessonVideos: [],
                contents: [],
            }
        }
        // ES-only scoping: derive moduleIds from enrolled courses (courses index stores `modules: [{ id }]`)
        const moduleIds = await this.resolveModuleIdsFromCoursesEs({
            courseIds,
            locale: resolvedLocale,
        })

        // ES-only scoping: derive contentIds from moduleIds (contents index stores `moduleId`)
        const contentIds = await this.resolveContentIdsFromModulesEs({
            moduleIds,
            locale: resolvedLocale,
        })


        const selected = new Set<SearchableEntity>(
            entities?.length
                ? entities
                : [
                    CourseEntity.name,
                    ModuleEntity.name,
                    ChallengeEntity.name,
                    LessonVideoEntity.name,
                    ContentEntity.name,
                ],
        )

        // run ES + DB searches in parallel by group
        const [
            courses,
            modules,
            challenges,
            lessonVideos,
            contents,
        ] = await Promise.all([
            selected.has(CourseEntity.name)
                ? this.searchAsYouType({
                    index: "courses",
                    term,
                    size,
                    locale: resolvedLocale,
                    must: [
                        {
                            terms: {
                                id: courseIds,
                            },
                        },
                    ],
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ModuleEntity.name)
                ? this.searchModules({
                    term,
                    size,
                    courseIds,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ChallengeEntity.name)
                ? this.searchAsYouType({
                    index: "challenges",
                    term,
                    size,
                    locale: resolvedLocale,
                    must: contentIds.length
                        ? [
                            {
                                terms: {
                                    contentId: contentIds,
                                },
                            },
                        ]
                        : [],
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(LessonVideoEntity.name)
                ? this.searchAsYouType({
                    index: "lesson-videos",
                    term,
                    size,
                    locale: resolvedLocale,
                    must: contentIds.length
                        ? [
                            {
                                terms: {
                                    contentId: contentIds,
                                },
                            },
                        ]
                        : [],
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ContentEntity.name)
                ? this.searchContentsFullText({
                    term,
                    size,
                    locale: resolvedLocale,
                    must: moduleIds.length
                        ? [
                            {
                                terms: {
                                    moduleId: moduleIds,
                                },
                            },
                        ]
                        : [],
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
        ])

        return {
            courses: this.dedupeItems(courses),
            modules: this.dedupeItems(modules),
            challenges: this.dedupeItems(challenges),
            lessonVideos: this.dedupeItems(lessonVideos),
            contents: this.dedupeItems(contents),
        }
    }

    /**
     * Dedupe search results by stable identity to avoid duplicates across locales.
     */
    private dedupeItems(items: Array<GlobalSearchItem>): Array<GlobalSearchItem> {
        const map = new Map<string, GlobalSearchItem>()
        for (const item of items) {
            const key = `${item.id}::${item.displayId}`
            if (!map.has(key)) {
                map.set(key,
                    item)
                continue
            }
            const prev = map.get(key)!
            const prevScore = prev.texts?.length ?? 0
            const nextScore = item.texts?.length ?? 0
            if (nextScore > prevScore) {
                map.set(key,
                    item)
            }
        }
        return Array.from(map.values())
    }

    /**
     * Fuzzy suggestion-style search on `title` (search_as_you_type bool_prefix + fuzzy fallback).
     */
    private async searchAsYouType(
        {
            index,
            term,
            size,
            locale,
            must: mustFilters,
        }: {
            index: string
            term: string
            size: number
            locale?: string
            must?: Array<estypes.QueryDslQueryContainer>
        },
    ): Promise<Array<GlobalSearchItem>> {
        const must: Array<estypes.QueryDslQueryContainer> = [
            ...(mustFilters ?? []),
        ]
        if (locale) {
            must.push({
                term: {
                    locale,
                },
            })
        }

        const esQuery: estypes.QueryDslQueryContainer = {
            bool: {
                must,
                should: [
                    {
                        multi_match: {
                            query: term,
                            type: "bool_prefix",
                            fields: [
                                `${TITLE_FIELD}^4`,
                                `${TITLE_FIELD}._2gram^3`,
                                `${TITLE_FIELD}._3gram^2`,
                            ],
                        },
                    },
                    {
                        match: {
                            [TITLE_FIELD]: {
                                query: term,
                                fuzziness: "AUTO",
                                prefix_length: 1,
                            },
                        },
                    },
                ],
                minimum_should_match: 1,
            },
        }

        const response = await this.elasticsearch.client.search({
            index,
            size,
            query: esQuery,
            highlight: {
                fields: {
                    [TITLE_FIELD]: {
                    },
                    [DESCRIPTION_FIELD]: {
                    },
                },
                pre_tags: ["<em>"],
                post_tags: ["</em>"],
            },
            _source: ["id",
                "displayId",
                TITLE_FIELD],
        })

        return response.hits.hits.map((hit) => {
            const source = hit._source as { id?: string; displayId?: string; title?: string } | undefined
            const texts = [
                ...(hit.highlight?.[TITLE_FIELD] ?? []),
                ...(hit.highlight?.[DESCRIPTION_FIELD] ?? []),
            ].filter(Boolean) as Array<string>
            return {
                id: source?.id ?? hit._id ?? "",
                displayId: source?.displayId ?? "",
                title: source?.title ?? "",
                texts: texts.length ? texts : [source?.title ?? ""].filter(Boolean) as Array<string>,
            }
        })
    }

    /**
     * Full-text search for contents by `title` + `description` and return matched snippets.
     */
    private async searchContentsFullText(
        {
            term,
            size,
            locale,
            must: mustFilters,
        }: {
            term: string
            size: number
            locale?: string
            must?: Array<estypes.QueryDslQueryContainer>
        },
    ): Promise<Array<GlobalSearchItem>> {
        const must: Array<estypes.QueryDslQueryContainer> = [
            ...(mustFilters ?? []),
        ]
        if (locale) {
            must.push({
                term: {
                    locale,
                },
            })
        }

        const esQuery: estypes.QueryDslQueryContainer = {
            bool: {
                must,
                should: [
                    {
                        multi_match: {
                            query: term,
                            fields: [
                                `${TITLE_FIELD}^4`,
                                `${DESCRIPTION_FIELD}^2`,
                            ],
                            fuzziness: "AUTO",
                        },
                    },
                ],
                minimum_should_match: 1,
            },
        }

        const response = await this.elasticsearch.client.search({
            index: "contents",
            size,
            query: esQuery,
            highlight: {
                fields: {
                    [TITLE_FIELD]: {
                    },
                    [DESCRIPTION_FIELD]: {
                    },
                },
                pre_tags: ["<em>"],
                post_tags: ["</em>"],
                number_of_fragments: 3,
                fragment_size: 140,
            },
            _source: ["id",
                "displayId",
                TITLE_FIELD,
                DESCRIPTION_FIELD],
        })

        return response.hits.hits.map((hit) => {
            const source = hit._source as { id?: string; displayId?: string; title?: string; description?: string } | undefined
            const texts = [
                ...(hit.highlight?.[TITLE_FIELD] ?? []),
                ...(hit.highlight?.[DESCRIPTION_FIELD] ?? []),
            ].filter(Boolean) as Array<string>

            return {
                id: source?.id ?? hit._id ?? "",
                displayId: source?.displayId ?? "",
                title: source?.title ?? "",
                texts: texts.length
                    ? texts
                    : [
                        source?.title ?? "",
                        source?.description ?? "",
                    ].filter(Boolean) as Array<string>,
            }
        })
    }

    /**
     * Search modules directly from PostgreSQL (since modules are not indexed in ES yet).
     */
    private async searchModules(
        {
            term,
            size,
            courseIds,
        }: {
            term: string
            size: number
            courseIds: Array<string>
        },
    ): Promise<Array<GlobalSearchItem>> {
        const rows = await this.entityManager.find(
            ModuleEntity,
            {
                select: {
                    id: true,
                    displayId: true,
                    title: true,
                    description: true,
                },
                where: [
                    {
                        title: ILike(`%${term}%`),
                        course: {
                            id: In(courseIds),
                        },
                    },
                    {
                        description: ILike(`%${term}%`),
                        course: {
                            id: In(courseIds),
                        },
                    },
                ],
                take: size,
            },
        )

        return rows.map((row) => ({
            id: row.id,
            displayId: row.displayId,
            title: row.title,
            texts: this.buildSimpleHighlights({
                term,
                texts: [
                    row.title,
                    row.description,
                ],
            }),
        }))
    }

    /**
     * Build simple highlights for a given term and texts.
     */
    private buildSimpleHighlights(
        {
            term,
            texts,
        }: {
            term: string
            texts: Array<string | null | undefined>
        },
    ): Array<string> {
        const needle = term.trim()
        if (!needle) return []

        return texts
            .filter((t): t is string => typeof t === "string" && t.length > 0)
            .map((t) => {
                const idx = t.toLowerCase().indexOf(needle.toLowerCase())
                if (idx < 0) return t
                const start = Math.max(
                    0,
                    idx - 40,
                )
                const end = Math.min(
                    t.length,
                    idx + needle.length + 60,
                )
                const snippet = t.slice(
                    start,
                    end,
                )
                return snippet.replace(
                    new RegExp(
                        needle,
                        "ig",
                    ),
                    "<em>$&</em>",
                )
            })
            .slice(
                0,
                3,
            )
    }

    /**
     * Resolves module IDs for a set of course IDs using Elasticsearch only.
     *
     * The courses index stores `modules: Array<{ id: string }>` as synced by the synchronizer.
     */
    private async resolveModuleIdsFromCoursesEs(
        {
            courseIds,
            locale,
        }: {
            courseIds: Array<string>
            locale?: string
        },
    ): Promise<Array<string>> {
        if (!courseIds.length) return []

        const must: Array<estypes.QueryDslQueryContainer> = [
            {
                terms: {
                    id: courseIds,
                },
            },
        ]
        if (locale) {
            must.push({
                term: {
                    locale,
                },
            })
        }

        const res = await this.elasticsearch.client.search<{
            modules?: Array<{ id: string }>
        }>({
            index: "courses",
            size: Math.min(
                courseIds.length,
                1000,
            ),
            query: {
                bool: {
                    must,
                },
            },
            _source: ["modules"],
        })

        const moduleIds = new Set<string>()
        for (const hit of res.hits.hits) {
            const source = hit._source
            for (const mod of source?.modules ?? []) {
                if (mod?.id) moduleIds.add(mod.id)
            }
        }
        return Array.from(moduleIds)
    }

    /**
     * Resolves content IDs for a set of module IDs using Elasticsearch only.
     *
     * Content documents contain `moduleId` (relation id) and `id` (uuid).
     */
    private async resolveContentIdsFromModulesEs(
        {
            moduleIds,
            locale,
        }: {
            moduleIds: Array<string>
            locale?: string
        },
    ): Promise<Array<string>> {
        if (!moduleIds.length) return []

        const must: Array<estypes.QueryDslQueryContainer> = [
            {
                terms: {
                    moduleId: moduleIds,
                },
            },
        ]
        if (locale) {
            must.push({
                term: {
                    locale,
                },
            })
        }

        // Guard: avoid huge term queries; limit to 10k ids for scoping.
        const res = await this.elasticsearch.client.search<{
            id?: string
        }>({
            index: "contents",
            size: 10_000,
            query: {
                bool: {
                    must,
                },
            },
            _source: ["id"],
        })

        return res.hits.hits
            .map((h) => h._source?.id ?? h._id)
            .filter((id): id is string => typeof id === "string" && id.length > 0)
    }
}

