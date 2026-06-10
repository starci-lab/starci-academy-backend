import {
    FlashcardDeckEntity,
    FlashcardDeckTranslationEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
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
    buildCompletionSuggest,
    ElasticsearchService,
} from "@modules/elasticsearch"

/**
 * Builds + indexes Elasticsearch documents for a flashcard deck across all locales.
 *
 * Flashcard decks have no hydration/resolver pair (unlike course-pipeline
 * entities), so this builder loads the deck with its translations directly and
 * resolves the localized `title`/`description` per locale. Each locale document
 * carries a `suggest` completion field (deck title + popularity weight) powering
 * the `flashcardDeckSuggestions` autocomplete query.
 */
@Injectable()
export class ElasticsearchFlashcardDeckBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * Resolve a translatable field for a locale, falling back to the deck's
     * default locale and finally the locale-agnostic base value.
     *
     * @param translations - The deck's loaded translation rows.
     * @param field - Field name being resolved (`"title"` | `"description"`).
     * @param locale - Requested locale.
     * @param fallbackLocale - Deck default locale used when the requested one is absent.
     * @param baseValue - Locale-agnostic value stored on the deck row itself.
     * @returns The best available localized value (never null/undefined).
     */
    private resolveField(
        translations: Array<FlashcardDeckTranslationEntity>,
        field: string,
        locale: Locale,
        fallbackLocale: Locale,
        baseValue: string,
    ): string {
        // pick the translation row matching this field + a given locale, if any
        const pick = (targetLocale: Locale): string | undefined =>
            translations.find(
                (translation) => translation.field === field
                    && translation.locale === targetLocale,
            )?.value
        // prefer requested locale → deck default → the base column value
        return pick(locale) ?? pick(fallbackLocale) ?? baseValue ?? ""
    }

    /**
     * Build one ES document per locale for the given deck.
     *
     * @param flashcardDeckId - Primary-key id of the deck to index.
     * @returns One `{ locale, entity }` pair per supported locale.
     */
    async buildMultilingualByFlashcardDeckId(
        flashcardDeckId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<FlashcardDeckEntity>>> {
        // load the FULL deck graph the `flashcardDeck` detail query serves (cards →
        // translations, linked contents, deck translations) so the document can be
        // returned straight from ES with the exact same shape the DB read produced
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
                    contents: true,
                    translations: true,
                },
                order: {
                    cards: {
                        orderIndex: "ASC",
                    },
                },
            },
        )
        // the deck's own copy locale is the fallback when a target locale is missing
        const fallbackLocale = deck.defaultLocale ?? Locale.En
        const translations = deck.translations ?? []
        return Object.values(Locale).map(
            (locale) => {
                // resolve the searchable text fields for this locale
                const title = this.resolveField(
                    translations,
                    "title",
                    locale,
                    fallbackLocale,
                    deck.title,
                ).trim()
                const description = this.resolveField(
                    translations,
                    "description",
                    locale,
                    fallbackLocale,
                    deck.description,
                )
                // populate the FST completion field with the clean title, weighted by
                // display order (earlier decks rank higher) for ranked autocomplete
                const suggest = buildCompletionSuggest({
                    inputs: [title],
                    weight: Math.max(1,
                        100 - (deck.orderIndex ?? 0)),
                })
                return {
                    locale,
                    // full detail doc so the `flashcardDeck` query can serve straight from ES:
                    // keep the entire loaded graph (cards + translations, contents, deck
                    // translations) and only override the searchable title/description with the
                    // per-locale values. `suggest` is index-only, so cast through unknown to
                    // satisfy the generic indexer while keeping the entity contract.
                    entity: {
                        ...deck,
                        title,
                        description,
                        suggest,
                    } as unknown as FlashcardDeckEntity,
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
