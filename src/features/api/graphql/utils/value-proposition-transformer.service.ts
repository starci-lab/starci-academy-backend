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

    transform(
        valueProposition: ValuePropositionEntity,
        locale: Locale,
        courseFallbackLocale: Locale,
    ): void {
        const fallbackLocale = valueProposition.defaultLocale ?? courseFallbackLocale
        valueProposition.content = this.translationResolver.resolve(
            {
                translations: valueProposition.translations,
                field: "content",
                locale,
                fallbackLocale,
            },
        )
    }
}
