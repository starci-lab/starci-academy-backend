import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    PreviewContentEntity,
    TranslationResolverService,
} from "@modules/databases"

/**
 * Applies translations to a module preview content line (GraphQL read path).
 */
@Injectable()
export class PreviewContentTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    transform(
        previewContent: PreviewContentEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
        previewContent.text = this.translationResolver.resolve(
            {
                translations: previewContent.translations,
                field: "text",
                locale,
                fallbackLocale,
            },
        )
    }
}
