import {
    Injectable,
} from "@nestjs/common"
import {
    FlashcardCardEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Applies translations to a single flashcard card (question / answer / explanation).
 */
export class FlashcardCardResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) { }

    /**
     * Resolves a single card's question/answer/explanation to the requested locale,
     * in place — mirrors {@link FlashcardDeckResolverService.transform}. `question`
     * always takes the resolved value since every card carries a translation row for
     * it; `answer`/`explanation` keep the base (nullable) value when no row exists,
     * so an answerless card is never blanked to `""`. `card.translations` is deleted
     * once consumed so raw locale rows never leak into the GraphQL response.
     * @param card - Card entity to localize; mutated directly.
     * @param locale - Locale requested by the caller.
     * @param fallbackLocale - Locale to fall back to when `card` carries no
     * `defaultLocale` of its own.
     */
    transform(
        card: FlashcardCardEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
        const rowFallback = card.defaultLocale ?? fallbackLocale
        // question is required → always take the resolved value (the merge emits a row
        // per locale, so the requested-or-default locale is present)
        card.question = this.translationResolver.resolve(
            {
                translations: card.translations,
                field: "question",
                locale,
                fallbackLocale: rowFallback,
            },
        )
        // answer / explanation are nullable: keep the base value when no translation
        // row exists at all (an answerless card stays answerless, never blanked to "")
        const answer = this.translationResolver.resolve(
            {
                translations: card.translations,
                field: "answer",
                locale,
                fallbackLocale: rowFallback,
            },
        )
        card.answer = answer !== ""
            ? answer
            : card.answer
        const explanation = this.translationResolver.resolve(
            {
                translations: card.translations,
                field: "explanation",
                locale,
                fallbackLocale: rowFallback,
            },
        )
        card.explanation = explanation !== ""
            ? explanation
            : card.explanation
        delete (card as Partial<FlashcardCardEntity>).translations
    }
}
