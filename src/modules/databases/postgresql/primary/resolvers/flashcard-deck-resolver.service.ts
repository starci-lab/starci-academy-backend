import {
    Injectable,
} from "@nestjs/common"
import {
    FlashcardDeckEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"
import {
    FlashcardCardResolverService,
} from "./flashcard-card-resolver.service"

/**
 * Applies translations to a flashcard deck (title / description) and recurses
 * into its cards. Mutates in place and strips the consumed `translations` arrays,
 * mirroring {@link ContentResolverService}.
 */
@Injectable()
export class FlashcardDeckResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly flashcardCardResolver: FlashcardCardResolverService,
    ) { }

    /**
     * Resolves the deck's title/description to the requested locale and recurses
     * into every card, in place — callers must read the result off `deck` itself,
     * not off a return value. `deck.translations` is deleted once consumed so the
     * raw locale rows never leak past the resolver into the GraphQL response.
     * @param deck - Deck entity to localize; mutated directly.
     * @param locale - Locale requested by the caller.
     * @param fallbackLocale - Locale to fall back to when `deck` carries no
     * `defaultLocale` of its own (e.g. a deck seeded before per-deck defaults existed).
     */
    transform(
        deck: FlashcardDeckEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
        const deckFallback = deck.defaultLocale ?? fallbackLocale
        // keep the base value when a deck somehow carries no translation rows
        const title = this.translationResolver.resolve(
            {
                translations: deck.translations,
                field: "title",
                locale,
                fallbackLocale: deckFallback,
            },
        )
        deck.title = title !== ""
            ? title
            : deck.title
        const description = this.translationResolver.resolve(
            {
                translations: deck.translations,
                field: "description",
                locale,
                fallbackLocale: deckFallback,
            },
        )
        deck.description = description !== ""
            ? description
            : deck.description
        delete (deck as Partial<FlashcardDeckEntity>).translations
        // localize each card with the deck's locale fallback
        deck.cards = (deck.cards ?? []).map(
            (card) => {
                this.flashcardCardResolver.transform(
                    card,
                    locale,
                    deckFallback,
                )
                return card
            },
        )
    }
}
