import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    FlashcardDeckResolverService,
} from "@modules/databases/postgresql/primary/resolvers/flashcard-deck-resolver.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    buildCompletionSuggest,
} from "@modules/integrations/elasticsearch/utils/completion"
import _ from "lodash"

@Injectable()
/**
 * Builds + indexes Elasticsearch documents for a flashcard deck across all locales.
 *
 * Flashcard decks have no hydration pair, so this builder loads the deck graph
 * (cards -> translations, deck translations) directly and runs the shared
 * {@link FlashcardDeckResolverService} per locale to localize `title`/
 * `description` plus every card's `question`/`answer`/`explanation`. Each locale
 * document also carries a `suggest` completion field (deck title + popularity
 * weight) powering the `flashcardDeckSuggestions` autocomplete query.
 */
export class ElasticsearchFlashcardDeckBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearchService: ElasticsearchService,
        private readonly flashcardDeckResolver: FlashcardDeckResolverService,
    ) {}

    /**
     * Build one ES document per locale for the given deck.
     *
     * @param flashcardDeckId - Primary-key id of the deck to index.
     * @returns One `{ locale, entity }` pair per supported locale.
     */
    async buildMultilingualByFlashcardDeckId(
        flashcardDeckId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<FlashcardDeckEntity>>> {
        // load the FULL deck graph the `flashcardDeck` detail query serves (cards ->
        // translations, deck translations) so the document can be returned straight
        // from ES with the exact same shape the DB read produced
        const deck = await this.entityManager.findOneOrFail(
            FlashcardDeckEntity,
            {
                where: {
                    id: flashcardDeckId,
                },
                relations: {
                    cards: {
                        translations: true,
                    },
                    translations: true,
                },
                order: {
                    cards: {
                        sortIndex: "ASC",
                    },
                },
            },
        )
        // the deck's own copy locale is the fallback when a target locale is missing
        const fallbackLocale = deck.defaultLocale ?? Locale.En
        return Object.values(Locale).map(
            (locale) => {
                // clone per locale, then localize deck + cards in place (the resolver
                // strips the consumed translation arrays)
                const localizedDeck = _.cloneDeep(deck)
                this.flashcardDeckResolver.transform(
                    localizedDeck,
                    locale,
                    fallbackLocale,
                )
                // populate the FST completion field with the localized title, weighted by
                // display order (earlier decks rank higher) for ranked autocomplete
                const suggest = buildCompletionSuggest({
                    inputs: [(localizedDeck.title ?? "").trim()],
                    weight: Math.max(1,
                        100 - (deck.orderIndex ?? 0)),
                })
                return {
                    locale,
                    entity: Object.assign(
                        localizedDeck,
                        {
                            suggest,
                        },
                    ),
                }
            },
        )
    }

    /**
     * Build + index the deck across every locale.
     *
     * @param id - Primary-key id of the deck to index.
     */
    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByFlashcardDeckId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity({
                entity: FlashcardDeckEntity,
                data: multilingualEntity.entity,
                locale: multilingualEntity.locale,
            })
        }
    }
}
