import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    TranslationResolverService,
    ValuePropositionEntity,
} from "@modules/databases"

/**
 * Applies translations to a course value proposition row.
 */
@Injectable()
export class ValuePropositionTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    /**
     * Applies translations to a course value proposition row.
     * @param valueProposition - The value proposition entity to transform.
     * @param locale - The locale to transform the value proposition to.
     * @param courseFallbackLocale - The fallback locale to use if the value proposition's default locale is not available.
     * @returns void.
     */
    transform(
        valueProposition: ValuePropositionEntity,
        locale: Locale,
        courseFallbackLocale: Locale,
    ): void {
        const fallbackLocale = valueProposition.defaultLocale ?? courseFallbackLocale
        valueProposition.text = this.translationResolver.resolve(
            {
                translations: valueProposition.translations,
                field: "text",
                locale,
                fallbackLocale,
            },
        )
    }
}
