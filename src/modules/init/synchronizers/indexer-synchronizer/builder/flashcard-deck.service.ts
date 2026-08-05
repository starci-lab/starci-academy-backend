import {
    FlashcardDeckEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    FlashcardDeckNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CacheKey,
    CacheService,
    FlashcardDeckParentIndexCacheResult,
} from "@modules/cache"

@Injectable()
/**
 * Primes the parent-index cache for a flashcard deck so global-search hits can build a deep-link URL.
 *
 * Decks live at the course level (their own course tab), so the cached ref only needs the owning
 * course; the client routes a deck hit to that course's `/learn/flashcards` page.
 */
export class IndexerFlashcardDeckBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Builds the parent-index entry for the given flashcard deck id.
     * @param id - The flashcard deck id.
     */
    async buildIndexerById(
        id: string,
    ): Promise<void> {
        const deck = await this.entityManager.findOne(
            FlashcardDeckEntity,
            {
                where: {
                    id,
                },
                relations: {
                    course: true,
                },
            },
        )
        if (!deck) {
            throw new FlashcardDeckNotFoundException(
                {
                    flashcardDeckId: id,
                },
            )
        }
        const ref: FlashcardDeckParentIndexCacheResult = {
            course: {
                id: deck.course.id,
                displayId: deck.course.displayId,
            },
        }
        await this.cacheService.set(
            {
                key: CacheKey.ParentIndex,
                args: [
                    FlashcardDeckEntity.name,
                    id,
                ],
                cacheResult: ref,
            },
        )
    }
}
