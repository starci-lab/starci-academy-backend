import {
    Injectable,
} from "@nestjs/common"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import type {
    ParentIndexCacheResult,
} from "@modules/integrations/cache/types/cache-results/parent-index"
import {
    buildEntityRoute,
} from "@modules/platform/routing/utils/build-entity-route"
import type {
    AttachParentPathsParams,
    AttachStateFlagsParams,
    AttachStateFlagsResult,
    AutocompleteGlobalSearchExecuteParams,
    AutocompleteGlobalSearchExecuteResult,
} from "./types/autocomplete-global-search"
import type {
    SearchableEntity,
} from "./types/entity-search"
import type {
    GlobalSearchItem,
    GlobalSearchParentPath,
} from "./types/message"
import {
    ChallengeGlobalSearchService,
} from "./entities/challenge.service"
import {
    ContentGlobalSearchService,
} from "./entities/content.service"
import {
    CourseGlobalSearchService,
} from "./entities/course.service"
import {
    FlashcardDeckGlobalSearchService,
} from "./entities/flashcard-deck.service"
import {
    FoundationGlobalSearchService,
} from "./entities/foundation.service"
import {
    MilestoneTaskGlobalSearchService,
} from "./entities/milestone-task.service"
import {
    MilestoneGlobalSearchService,
} from "./entities/milestone.service"
import {
    ModuleGlobalSearchService,
} from "./entities/module.service"

const DEFAULT_SIZE = 5

const DEFAULT_ENTITIES: Array<SearchableEntity> = [
    CourseEntity.name,
    ModuleEntity.name,
    ChallengeEntity.name,
    ContentEntity.name,
    FlashcardDeckEntity.name,
    MilestoneEntity.name,
    MilestoneTaskEntity.name,
    FoundationEntity.name,
]

const EMPTY_RESULT: AutocompleteGlobalSearchExecuteResult = {
    courses: [],
    modules: [],
    challenges: [],
    contents: [],
    flashcardDecks: [],
    milestones: [],
    milestoneTasks: [],
    foundations: [],
}

@Injectable()
/**
 * Orchestrates parallel per-entity ES searches, then hydrates each hit with a
 * cached ancestor chain + a server-built route so the client can deep-link
 * without a second round-trip. State flags (enrolled/free/premium) are
 * best-effort -- search must still return if enrichment fails.
 */
export class AutocompleteGlobalSearchService {
    constructor(
        private readonly courseSearch: CourseGlobalSearchService,
        private readonly moduleSearch: ModuleGlobalSearchService,
        private readonly challengeSearch: ChallengeGlobalSearchService,
        private readonly contentSearch: ContentGlobalSearchService,
        private readonly flashcardDeckSearch: FlashcardDeckGlobalSearchService,
        private readonly milestoneSearch: MilestoneGlobalSearchService,
        private readonly milestoneTaskSearch: MilestoneTaskGlobalSearchService,
        private readonly foundationSearch: FoundationGlobalSearchService,
        private readonly cacheService: CacheService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly winstonService: WinstonService,
    ) {}

    async execute(
        {
            request,
            locale,
            user,
        }: AutocompleteGlobalSearchExecuteParams,
    ): Promise<AutocompleteGlobalSearchExecuteResult> {
        const term = request.query?.trim() ?? ""
        if (!term) {
            return EMPTY_RESULT
        }

        // resolver always supplies a locale, but the type is optional -> default to En
        const searchLocale = locale ?? Locale.En
        const size = request.size ?? DEFAULT_SIZE
        const selected = new Set<SearchableEntity>(
            request.entities?.length
                ? (request.entities as Array<SearchableEntity>)
                : DEFAULT_ENTITIES,
        )

        const [
            courses,
            modules,
            challenges,
            contents,
            flashcardDecks,
            milestones,
            milestoneTasks,
            foundations,
        ] = await Promise.all([
            selected.has(CourseEntity.name)
                ? this.courseSearch.execute({
                    term,
                    size,
                    locale: searchLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ModuleEntity.name)
                ? this.moduleSearch.execute({
                    term,
                    size,
                    locale: searchLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ChallengeEntity.name)
                ? this.challengeSearch.execute({
                    term,
                    size,
                    locale: searchLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ContentEntity.name)
                ? this.contentSearch.execute({
                    term,
                    size,
                    locale: searchLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(FlashcardDeckEntity.name)
                ? this.flashcardDeckSearch.execute({
                    term,
                    size,
                    locale: searchLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(MilestoneEntity.name)
                ? this.milestoneSearch.execute({
                    term,
                    size,
                    locale: searchLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(MilestoneTaskEntity.name)
                ? this.milestoneTaskSearch.execute({
                    term,
                    size,
                    locale: searchLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(FoundationEntity.name)
                ? this.foundationSearch.execute({
                    term,
                    size,
                    locale: searchLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
        ])

        // dedupe each bucket, then enrich every hit with its ancestor chain so the
        // client can build a deep-link URL (course slug + module/content UUIDs).
        const [
            coursesWithPath,
            modulesWithPath,
            challengesWithPath,
            contentsWithPath,
            flashcardDecksWithPath,
            milestonesWithPath,
            milestoneTasksWithPath,
            foundationsWithPath,
        ] = await Promise.all([
            this.attachParentPaths({
                items: this.dedupeItems(courses),
                entityName: CourseEntity.name,
            }),
            this.attachParentPaths({
                items: this.dedupeItems(modules),
                entityName: ModuleEntity.name,
            }),
            this.attachParentPaths({
                items: this.dedupeItems(challenges),
                entityName: ChallengeEntity.name,
            }),
            this.attachParentPaths({
                items: this.dedupeItems(contents),
                entityName: ContentEntity.name,
            }),
            this.attachParentPaths({
                items: this.dedupeItems(flashcardDecks),
                entityName: FlashcardDeckEntity.name,
            }),
            this.attachParentPaths({
                items: this.dedupeItems(milestones),
                entityName: MilestoneEntity.name,
            }),
            this.attachParentPaths({
                items: this.dedupeItems(milestoneTasks),
                entityName: MilestoneTaskEntity.name,
            }),
            this.attachParentPaths({
                items: this.dedupeItems(foundations),
                entityName: FoundationEntity.name,
            }),
        ])

        // enrich course + content hits with state flags (enrolled / free / premium)
        // so the client can render free-content-first, state-aware rows. Non-fatal:
        // any failure logs and returns the buckets WITHOUT the new fields.
        const {
            courses: enrichedCourses,
            contents: enrichedContents,
        } = await this.attachStateFlags({
            courses: coursesWithPath,
            contents: contentsWithPath,
            user,
        })

        return {
            courses: enrichedCourses,
            modules: modulesWithPath,
            challenges: challengesWithPath,
            contents: enrichedContents,
            flashcardDecks: flashcardDecksWithPath,
            milestones: milestonesWithPath,
            milestoneTasks: milestoneTasksWithPath,
            foundations: foundationsWithPath,
        }
    }

    /**
     * Enriches course + content hits with state flags for state-aware, free-first
     * rendering -- NO live/discounted pricing:
     * - course `isEnrolled`: authed user has a real enrollment (is_enrolled = true);
     *   always false for guests.
     * - course `isFree`: no paid price (originalPrice null/0 AND no priced phase).
     * - content `isPremium`: mirrors ContentEntity.isPremium.
     *
     * Batched: one query for the course rows (id + originalPrice + phase prices),
     * one cached read for the user's enrolled-course set, one IN query for content
     * premium flags. Non-fatal -- on any error the original buckets are returned
     * unchanged (search must not break).
     *
     * @param params - {@link AttachStateFlagsParams}
     * @returns The course + content buckets, each hit carrying its state flags.
     */
    private async attachStateFlags(
        {
            courses,
            contents,
            user,
        }: AttachStateFlagsParams,
    ): Promise<AttachStateFlagsResult> {
        try {
            const courseIds = courses.map((item) => item.id)
            const contentIds = contents.map((item) => item.id)

            // batch: course free-detection rows + enrolled set + content premium map
            const [
                courseRows,
                enrolledCourseIds,
                premiumByContentId,
            ] = await Promise.all([
                this.loadCourseFreeRows(courseIds),
                this.loadEnrolledCourseIds(user?.id),
                this.loadContentPremiumMap(contentIds),
            ])

            const enrolledSet = new Set(enrolledCourseIds)

            const enrichedCourses = courses.map((item) => ({
                ...item,
                isEnrolled: enrolledSet.has(item.id),
                isFree: courseRows.get(item.id) ?? false,
            }))

            const enrichedContents = contents.map((item) => ({
                ...item,
                isPremium: premiumByContentId.get(item.id) ?? false,
            }))

            return {
                courses: enrichedCourses,
                contents: enrichedContents,
            }
        } catch (error) {
            // enrichment is best-effort; never let it break the search response
            this.winstonService.log(
                WinstonLog.BestEffortOperationFailed,
                {
                    op: "global-search.attach-state-flags",
                    userId: user?.id,
                    error: error instanceof Error ? error.message : String(error),
                },
            )
            return {
                courses,
                contents,
            }
        }
    }

    /**
     * Loads free-detection data for the given course ids in ONE query and derives
     * `isFree` per course: true when the course has no paid price -- `originalPrice`
     * is null or 0 AND no pricing phase has `price > 0`.
     * @param courseIds - The course hit ids to resolve.
     * @returns Map of course id -> isFree (empty when there are no ids).
     */
    private async loadCourseFreeRows(
        courseIds: Array<string>,
    ): Promise<Map<string, boolean>> {
        const result = new Map<string, boolean>()
        if (courseIds.length === 0) {
            return result
        }
        const rows = await this.entityManager.find(
            CourseEntity,
            {
                where: {
                    id: In(courseIds),
                },
                select: {
                    id: true,
                    originalPrice: true,
                    pricingPhases: {
                        id: true,
                        price: true,
                    },
                },
                relations: {
                    pricingPhases: true,
                },
            },
        )
        for (const row of rows) {
            const hasBasePrice = Boolean(row.originalPrice && row.originalPrice > 0)
            const hasPhasePrice = (row.pricingPhases ?? []).some(
                (phase) => Boolean(phase.price && phase.price > 0),
            )
            result.set(row.id,
                !hasBasePrice && !hasPhasePrice)
        }
        return result
    }

    /**
     * Loads the authed user's set of really-enrolled course ids (is_enrolled = true).
     * Uses the same per-user cache as the enrollment authorization hot path: read
     * once from cache, rebuilt with a single indexed query on miss. Returns an empty
     * array for guests (no user).
     * @param userId - The authed user id, or undefined for a guest.
     * @returns The enrolled course ids (empty for guests).
     */
    private async loadEnrolledCourseIds(
        userId: string | undefined,
    ): Promise<Array<string>> {
        // guests are never enrolled -> skip the DB entirely
        if (!userId) {
            return []
        }
        // one cache entry per user holds every course id they are enrolled in
        const cached = await this.cacheService.get({
            key: CacheKey.UserEnrolledCourses,
            args: [
                userId,
            ],
        })
        if (cached !== undefined) {
            return cached
        }
        // cache miss -> rebuild the whole set with a single indexed read on (user_id)
        const rows = await this.entityManager.find(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    isEnrolled: true,
                },
                select: {
                    id: true,
                    course: {
                        id: true,
                    },
                },
                relations: {
                    course: true,
                },
            },
        )
        const courseIds = rows
            .map((row) => row.course?.id)
            .filter((id): id is string => Boolean(id))
        // cache the rebuilt set (TTL safety net; del-on-write keeps it correct)
        await this.cacheService.set({
            key: CacheKey.UserEnrolledCourses,
            args: [
                userId,
            ],
            cacheResult: courseIds,
        })
        return courseIds
    }

    /**
     * Loads the `isPremium` flag for the given content ids in ONE `IN` query.
     * @param contentIds - The content hit ids to resolve.
     * @returns Map of content id -> isPremium (empty when there are no ids).
     */
    private async loadContentPremiumMap(
        contentIds: Array<string>,
    ): Promise<Map<string, boolean>> {
        const result = new Map<string, boolean>()
        if (contentIds.length === 0) {
            return result
        }
        const rows = await this.entityManager.find(
            ContentEntity,
            {
                where: {
                    id: In(contentIds),
                },
                select: {
                    id: true,
                    isPremium: true,
                },
            },
        )
        for (const row of rows) {
            result.set(row.id,
                Boolean(row.isPremium))
        }
        return result
    }

    /**
     * Enriches each hit in a bucket with its parent-path resolved from the sync-indexer
     * parent-index cache (keyed by entity name + id). Hits with no cache entry keep an
     * undefined parentPath and are returned unchanged.
     * @param params - {@link AttachParentPathsParams}
     * @returns The same items, each carrying a hydrated `parentPath` when available.
     */
    private async attachParentPaths(
        {
            items,
            entityName,
        }: AttachParentPathsParams,
    ): Promise<Array<GlobalSearchItem>> {
        // resolve every hit's ancestor chain in parallel -- one cache read per hit
        return Promise.all(items.map(async (item) => {
            // look up the precomputed parent graph cached during indexer sync
            const parentRef = await this.cacheService.get({
                key: CacheKey.ParentIndex,
                args: [
                    entityName,
                    item.id,
                ],
            })
            // attach the normalized parent-path + the server-built canonical route
            // (same SSOT builder as the resolveRoute index); path is null on miss
            return {
                ...item,
                parentPath: this.toParentPath(parentRef),
                path: buildEntityRoute({
                    entityName,
                    id: item.id,
                    parentRef,
                }),
            }
        }))
    }

    /**
     * Normalizes a cached parent-index ref into the GraphQL parent-path shape, keeping
     * only the ancestor levels present for the hit's entity kind.
     * @param parentRef - Cached ancestor graph, or undefined on a cache miss.
     * @returns The parent-path, or undefined when there is nothing cached.
     */
    private toParentPath(
        parentRef: ParentIndexCacheResult | undefined,
    ): GlobalSearchParentPath | undefined {
        // nothing cached -> leave parentPath unset so the client falls back gracefully
        if (!parentRef) {
            return undefined
        }
        // copy each level only when present (course-only, module+course, etc.)
        return {
            course: "course" in parentRef ? parentRef.course : undefined,
            module: "module" in parentRef ? parentRef.module : undefined,
            content: "content" in parentRef ? parentRef.content : undefined,
            challenge: "challenge" in parentRef ? parentRef.challenge : undefined,
            task: "task" in parentRef ? parentRef.task : undefined,
        }
    }

    private dedupeItems(items: Array<GlobalSearchItem>): Array<GlobalSearchItem> {
        const map = new Map<string, GlobalSearchItem>()
        for (const item of items) {
            const key = `${item.id}::${item.displayId}`
            const previous = map.get(key)
            if (!previous || (item.texts?.length ?? 0) > (previous.texts?.length ?? 0)) {
                map.set(key,
                    item)
            }
        }
        return Array.from(map.values())
    }
}
