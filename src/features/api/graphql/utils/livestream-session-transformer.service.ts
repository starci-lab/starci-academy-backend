import {
    Injectable,
} from "@nestjs/common"
import {
    LivestreamSessionEntity,
    Locale,
    TranslationResolverService,
} from "@modules/databases"

/**
 * Applies translations to a livestream session row (GraphQL read path).
 */
@Injectable()
export class LivestreamSessionTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    /**
     * Resolves localized `note` from translations when present.
     */
    transform(
        session: LivestreamSessionEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ) {
        const note = this.translationResolver.resolve(
            {
                translations: session.translations,
                field: "note",
                locale,
                fallbackLocale,
            },
        )
        session.note = note?.trim() || session.note
    }
}
