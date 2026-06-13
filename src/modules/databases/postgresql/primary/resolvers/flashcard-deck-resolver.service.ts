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
