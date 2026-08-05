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
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    ModuleEntity,
} from "@modules/databases"
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
} from "./constants"
import {
    ChallengeGlobalSearchService,
    ContentGlobalSearchService,
    CourseGlobalSearchService,
    ModuleGlobalSearchService,
} from "./entities"

@QueryHandler(GlobalSearchQuery)
@Injectable()
/**
 * Handler that performs fuzzy search across multiple Elasticsearch indices
 * (contents, challenges, courses, modules) and merges results by score.
 */
export class GlobalSearchHandler
    extends ICQRSHandler<GlobalSearchQuery, GlobalSearchSocketIoMessage>
    implements IQueryHandler<GlobalSearchQuery, GlobalSearchSocketIoMessage> {
    constructor(
        private readonly courseSearch: CourseGlobalSearchService,
        private readonly moduleSearch: ModuleGlobalSearchService,
        private readonly challengeSearch: ChallengeGlobalSearchService,
        private readonly contentSearch: ContentGlobalSearchService,
    ) {
        super()
    }

    /**
     * Processes the global search query.
     * @param query - The global search query.
     * @returns The global search socket io message.
     */
    protected override async process(
        query: GlobalSearchQuery,
    ): Promise<GlobalSearchSocketIoMessage> {
        const { payload } = query.params
        const {
            data: {
                query: termRaw,
                entities,
                size = DEFAULT_SIZE,
            },
            locale,
        } = payload
        const resolvedLocale = locale
        const term = termRaw?.trim() ?? ""
        if (term.length === 0) {
            return {
                courses: [],
                modules: [],
                challenges: [],
                contents: [],
            }
        }
        const selected = new Set<SearchableEntity>(
            entities?.length
                ? entities
                : [
                    CourseEntity.name,
                    ModuleEntity.name,
                    ChallengeEntity.name,
                    ContentEntity.name,
                ],
        )

        const [
            courses,
            modules,
            challenges,
            contents,
        ] = await Promise.all([
            selected.has(CourseEntity.name)
                ? this.courseSearch.execute({
                    term,
                    size,
                    locale: resolvedLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ModuleEntity.name)
                ? this.moduleSearch.execute({
                    term,
                    size,
                    locale: resolvedLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ChallengeEntity.name)
                ? this.challengeSearch.execute({
                    term,
                    size,
                    locale: resolvedLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ContentEntity.name)
                ? this.contentSearch.execute({
                    term,
                    size,
                    locale: resolvedLocale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
        ])

        return {
            courses: this.dedupeItems(courses),
            modules: this.dedupeItems(modules),
            challenges: this.dedupeItems(challenges),
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
}
