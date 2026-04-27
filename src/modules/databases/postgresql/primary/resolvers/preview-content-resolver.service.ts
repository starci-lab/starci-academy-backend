import {
    Injectable,
} from "@nestjs/common"
import {
    PreviewContentEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

/**
 * Applies translations to a module preview content line.
 */
@Injectable()
export class PreviewContentResolverService {
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
        delete (previewContent as Partial<PreviewContentEntity>).translations
    }
}
