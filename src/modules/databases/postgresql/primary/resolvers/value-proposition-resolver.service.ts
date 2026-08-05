import {
    Injectable,
} from "@nestjs/common"
import {
    ValuePropositionEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Applies translations to a course value proposition row.
 */
export class ValuePropositionResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

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
        delete (valueProposition as Partial<ValuePropositionEntity>).translations
    }
}
