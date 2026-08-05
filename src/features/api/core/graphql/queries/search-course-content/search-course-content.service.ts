import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeEntity,
    ContentEntity,
    FlashcardDeckEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    MilestoneTaskEntity,
    ModuleEntity,
    TranslationResolverService,
} from "@modules/databases"
import {
    CourseRagRetrievalService,
    SearchCourseHit,
} from "@modules/rag"
import {
    In,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    SearchCourseContentItem,
} from "./graphql-types"

/** Params for {@link SearchCourseContentService.search}. */
export interface SearchCourseContentParams {
    /** The course to search within (scopes the RAG query). */
    courseId: string
    /** The learner's search query (keyword or natural-language question alike). */
    query: string
    /**
     * Optional corpus-kind filter (`["challenge"]`, `["milestone"]`, or
     * `["content", "code"]` for lessons). Omit → search every indexed kind.
     */
    kinds?: Array<string>
}

@Injectable()
/**
 * "Tìm nội dung khóa" — resolves RAG hits (raw vectors, no entity knowledge)
 * into display-ready results per kind: joins each matched id back to its real
 * entity (Content/Challenge/FlashcardDeck/MilestoneTask) for title/breadcrumb,
 * resolved in whichever locale the winning chunk was embedded in (so a vi
 * query surfaces vi titles even if the learner's own UI locale differs).
 */
export class SearchCourseContentService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly contentRagRetrievalService: CourseRagRetrievalService,
        private readonly translationResolver: TranslationResolverService,
    ) {}

    /**
     * Run the RAG search then join every hit to a display-ready result.
     *
     * @param params - {@link SearchCourseContentParams}.
     * @returns Distinct matched sources, best match first (a hit whose source
     * row vanished since indexing — e.g. deleted content — is silently dropped).
     */
    async search(
        {
            courseId,
            query,
            kinds,
        }: SearchCourseContentParams,
    ): Promise<Array<SearchCourseContentItem>> {
        const { hits } = await this.contentRagRetrievalService.searchCourse({
            courseId,
            query,
            kinds,
        })
        if (hits.length === 0) {
            return []
        }

        // "code" chunks share their parent lesson's id with "content" chunks
        // (both stamped by ContentRagIndexService with contentId = content.id) —
        // group them under the SAME lookup so a code-only match still resolves
        // to its lesson.
        const idsByKind = new Map<string, Array<string>>()
        for (const hit of hits) {
            const kind = hit.kind === "code" ? "content" : hit.kind
            const ids = idsByKind.get(kind) ?? []
            ids.push(hit.contentId)
            idsByKind.set(kind,
                ids)
        }

        const [
            contentById,
            challengeById,
            deckById,
            taskById,
        ] = await Promise.all([
            this.loadContents(idsByKind.get("content") ?? []),
            this.loadChallenges(idsByKind.get("challenge") ?? []),
            this.loadFlashcardDecks(idsByKind.get("flashcard") ?? []),
            this.loadMilestoneTasks(idsByKind.get("milestone") ?? []),
        ])

        const results: Array<SearchCourseContentItem> = []
        for (const hit of hits) {
            const locale = hit.lang === Locale.En ? Locale.En : Locale.Vi
            const item = this.resolveItem(
                hit,
                locale,
                contentById,
                challengeById,
                deckById,
                taskById,
            )
            if (item) {
                results.push(item)
            }
        }
        return results
    }

    /** Batch-load contents (+ their module) by id, keyed by content id. */
    private async loadContents(
        ids: Array<string>,
    ): Promise<Map<string, ContentEntity>> {
        if (ids.length === 0) {
            return new Map()
        }
        const contents = await this.entityManager.find(
            ContentEntity,
            {
                where: {
                    id: In(ids),
                },
                relations: {
                    translations: true,
                    module: {
                        translations: true,
                    },
                },
            },
        )
        return new Map(contents.map((content) => [content.id,
            content]))
    }

    /** Batch-load challenges (+ their content's module) by id, keyed by challenge id. */
    private async loadChallenges(
        ids: Array<string>,
    ): Promise<Map<string, ChallengeEntity>> {
        if (ids.length === 0) {
            return new Map()
        }
        const challenges = await this.entityManager.find(
            ChallengeEntity,
            {
                where: {
                    id: In(ids),
                },
                relations: {
                    translations: true,
                    content: {
                        module: {
                            translations: true,
                        },
                    },
                },
            },
        )
        return new Map(challenges.map((challenge) => [challenge.id,
            challenge]))
    }

    /** Batch-load flashcard decks by id, keyed by deck id. */
    private async loadFlashcardDecks(
        ids: Array<string>,
    ): Promise<Map<string, FlashcardDeckEntity>> {
        if (ids.length === 0) {
            return new Map()
        }
        const decks = await this.entityManager.find(
            FlashcardDeckEntity,
            {
                where: {
                    id: In(ids),
                },
                relations: {
                    translations: true,
                },
            },
        )
        return new Map(decks.map((deck) => [deck.id,
            deck]))
    }

    /** Batch-load milestone tasks (+ their milestone) by id, keyed by task id. */
    private async loadMilestoneTasks(
        ids: Array<string>,
    ): Promise<Map<string, MilestoneTaskEntity>> {
        if (ids.length === 0) {
            return new Map()
        }
        const tasks = await this.entityManager.find(
            MilestoneTaskEntity,
            {
                where: {
                    id: In(ids),
                },
                relations: {
                    translations: true,
                    milestone: {
                        translations: true,
                    },
                },
            },
        )
        return new Map(tasks.map((task) => [task.id,
            task]))
    }

    /** Resolve a module's title in the given locale. */
    private resolveModuleTitle(
        module: ModuleEntity,
        locale: Locale,
    ): string {
        return this.translationResolver.resolve({
            translations: module.translations,
            field: "title",
            locale,
            fallbackLocale: module.defaultLocale ?? locale,
        }) || module.title
    }

    /**
     * Join one RAG hit to its display-ready result. Returns null when the
     * matched row is missing from the batch-load (its source vanished since
     * indexing — a stale chunk not yet swept by the next diff-aware rebuild).
     */
    private resolveItem(
        hit: SearchCourseHit,
        locale: Locale,
        contentById: Map<string, ContentEntity>,
        challengeById: Map<string, ChallengeEntity>,
        deckById: Map<string, FlashcardDeckEntity>,
        taskById: Map<string, MilestoneTaskEntity>,
    ): SearchCourseContentItem | null {
        const shared = {
            snippet: hit.snippet.slice(0,
                280),
            score: hit.score,
        }
        if (hit.kind === "challenge") {
            const challenge = challengeById.get(hit.contentId)
            if (!challenge) {
                return null
            }
            const title = this.translationResolver.resolve({
                translations: challenge.translations,
                field: "title",
                locale,
                fallbackLocale: challenge.defaultLocale ?? locale,
            }) || challenge.title
            return {
                kind: "challenge",
                title,
                breadcrumb: challenge.content?.module ? this.resolveModuleTitle(challenge.content.module,
                    locale) : null,
                moduleId: challenge.content?.module?.id ?? null,
                contentId: challenge.content?.id ?? null,
                deckId: null,
                taskId: null,
                ...shared,
            }
        }
        if (hit.kind === "flashcard") {
            const deck = deckById.get(hit.contentId)
            if (!deck) {
                return null
            }
            const title = this.translationResolver.resolve({
                translations: deck.translations,
                field: "title",
                locale,
                fallbackLocale: deck.defaultLocale ?? locale,
            }) || deck.title
            return {
                kind: "flashcard",
                title,
                breadcrumb: null,
                moduleId: null,
                contentId: null,
                deckId: deck.id,
                taskId: null,
                ...shared,
            }
        }
        if (hit.kind === "milestone") {
            const task = taskById.get(hit.contentId)
            if (!task) {
                return null
            }
            const title = this.translationResolver.resolve({
                translations: task.translations,
                field: "title",
                locale,
                fallbackLocale: task.defaultLocale ?? locale,
            }) || task.title
            const breadcrumb = task.milestone
                ? (this.translationResolver.resolve({
                    translations: task.milestone.translations,
                    field: "title",
                    locale,
                    fallbackLocale: task.milestone.defaultLocale ?? locale,
                }) || task.milestone.title)
                : null
            return {
                kind: "milestone",
                title,
                breadcrumb,
                moduleId: null,
                contentId: null,
                deckId: null,
                taskId: task.id,
                ...shared,
            }
        }
        // "content" (also covers a "code" hit normalized above)
        const content = contentById.get(hit.contentId)
        if (!content) {
            return null
        }
        const title = this.translationResolver.resolve({
            translations: content.translations,
            field: "title",
            locale,
            fallbackLocale: content.defaultLocale ?? locale,
        }) || content.title
        return {
            kind: "content",
            title,
            breadcrumb: content.module ? this.resolveModuleTitle(content.module,
                locale) : null,
            moduleId: content.module?.id ?? null,
            contentId: content.id,
            deckId: null,
            taskId: null,
            ...shared,
        }
    }
}
