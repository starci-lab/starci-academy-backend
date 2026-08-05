import {
    Injectable,
} from "@nestjs/common"
import {
    FoundationCategoryEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Applies translations to a foundation category row.
 */
export class FoundationCategoryResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    transform(
        category: FoundationCategoryEntity,
        locale: Locale,
    ): void {
        const fallbackLocale = category.defaultLocale
        category.title = this.translationResolver.resolve(
            {
                translations: category.translations,
                field: "title",
                locale,
                fallbackLocale,
            },
        )
        category.description = this.translationResolver.resolve(
            {
                translations: category.translations,
                field: "description",
                locale,
                fallbackLocale,
            },
        )
        delete (category as Partial<FoundationCategoryEntity>).translations
        delete (category as Partial<FoundationCategoryEntity>).foundations
    }
}
