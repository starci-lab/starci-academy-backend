import {
    Injectable,
} from "@nestjs/common"
import {
    PreviewContentEntity,
} from "../entities/preview-content.entity"
import {
    Locale,
} from "../enums/locale"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Applies translations to a module preview content line.
 */
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
