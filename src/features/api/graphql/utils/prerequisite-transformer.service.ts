import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    PrerequisiteEntity,
    TranslationResolverService,
} from "@modules/databases"

/**
 * Applies translations to a course prerequisite row.
 */
@Injectable()
export class PrerequisiteTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    transform(
        prerequisite: PrerequisiteEntity,
        locale: Locale,
        courseFallbackLocale: Locale,
    ): void {
        const fallbackLocale = prerequisite.defaultLocale ?? courseFallbackLocale
        prerequisite.text = this.translationResolver.resolve(
            {
                translations: prerequisite.translations,
                field: "text",
                locale,
                fallbackLocale,
            },
        )
    }
}
