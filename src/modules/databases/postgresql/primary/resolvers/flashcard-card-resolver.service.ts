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

/**
 * Applies translations to a single flashcard card (question / answer / explanation).
 */
@Injectable()
export class FlashcardCardResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) { }

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
