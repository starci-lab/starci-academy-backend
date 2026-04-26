import {
    Injectable,
} from "@nestjs/common"
import {
    LivestreamSessionEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

/**
 * Applies translations to a livestream session row.
 */
@Injectable()
export class LivestreamSessionResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

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
