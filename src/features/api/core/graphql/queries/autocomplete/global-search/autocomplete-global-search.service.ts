import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    ModuleEntity,
    FlashcardDeckEntity,
    MilestoneEntity,
    MilestoneTaskEntity,
    FoundationEntity,
    Locale,
} from "@modules/databases"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import type {
    ParentIndexCacheResult,
} from "@modules/cache"
import {
    buildEntityRoute,
} from "@modules/routing"
import type {
    AttachParentPathsParams,
    AutocompleteGlobalSearchExecuteParams,
    AutocompleteGlobalSearchExecuteResult,
    GlobalSearchItem,
    GlobalSearchParentPath,
    SearchableEntity,
} from "./types"
import {
    ChallengeGlobalSearchService,
    ContentGlobalSearchService,
    CourseGlobalSearchService,
    ModuleGlobalSearchService,
    FlashcardDeckGlobalSearchService,
    MilestoneGlobalSearchService,
    MilestoneTaskGlobalSearchService,
    FoundationGlobalSearchService,
} from "./entities"

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
    ) {}

    async execute(
        {
            request,
            locale,
        }: AutocompleteGlobalSearchExecuteParams,
    ): Promise<AutocompleteGlobalSearchExecuteResult> {
        const term = request.query?.trim() ?? ""
        if (!term) {
            return EMPTY_RESULT
        }

        // resolver always supplies a locale, but the type is optional → default to En
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

        return {
            courses: coursesWithPath,
            modules: modulesWithPath,
            challenges: challengesWithPath,
            contents: contentsWithPath,
            flashcardDecks: flashcardDecksWithPath,
            milestones: milestonesWithPath,
            milestoneTasks: milestoneTasksWithPath,
            foundations: foundationsWithPath,
        }
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
        // resolve every hit's ancestor chain in parallel — one cache read per hit
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
        // nothing cached → leave parentPath unset so the client falls back gracefully
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
