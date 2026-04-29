import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    LessonVideoEntity,
    ModuleEntity,
} from "@modules/databases"
import type {
    AutocompleteGlobalSearchExecuteParams,
    AutocompleteGlobalSearchExecuteResult,
    GlobalSearchItem,
    SearchableEntity,
} from "./types"
import {
    ChallengeGlobalSearchService,
    ContentGlobalSearchService,
    CourseGlobalSearchService,
    LessonVideoGlobalSearchService,
    ModuleGlobalSearchService,
} from "./entities"

const DEFAULT_SIZE = 5

const DEFAULT_ENTITIES: Array<SearchableEntity> = [
    CourseEntity.name,
    ModuleEntity.name,
    ChallengeEntity.name,
    LessonVideoEntity.name,
    ContentEntity.name,
]

const EMPTY_RESULT: AutocompleteGlobalSearchExecuteResult = {
    courses: [],
    modules: [],
    challenges: [],
    lessonVideos: [],
    contents: [],
}

@Injectable()
export class AutocompleteGlobalSearchService {
    constructor(
        private readonly courseSearch: CourseGlobalSearchService,
        private readonly moduleSearch: ModuleGlobalSearchService,
        private readonly challengeSearch: ChallengeGlobalSearchService,
        private readonly lessonVideoSearch: LessonVideoGlobalSearchService,
        private readonly contentSearch: ContentGlobalSearchService,
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
            lessonVideos,
            contents,
        ] = await Promise.all([
            selected.has(CourseEntity.name)
                ? this.courseSearch.execute({
                    term,
                    size,
                    locale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ModuleEntity.name)
                ? this.moduleSearch.execute({
                    term,
                    size,
                    locale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ChallengeEntity.name)
                ? this.challengeSearch.execute({
                    term,
                    size,
                    locale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(LessonVideoEntity.name)
                ? this.lessonVideoSearch.execute({
                    term,
                    size,
                    locale,
                })
                : Promise.resolve([] as Array<GlobalSearchItem>),
            selected.has(ContentEntity.name)
                ? this.contentSearch.execute({
                    term,
                    size,
                    locale,
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

    private dedupeItems(items: Array<GlobalSearchItem>): Array<GlobalSearchItem> {
        const map = new Map<string, GlobalSearchItem>()
        for (const item of items) {
            const key = `${item.id}::${item.displayId}`
            const previous = map.get(key)
            if (!previous || (item.texts?.length ?? 0) > (previous.texts?.length ?? 0)) {
                map.set(key, item)
            }
        }
        return Array.from(map.values())
    }
}
