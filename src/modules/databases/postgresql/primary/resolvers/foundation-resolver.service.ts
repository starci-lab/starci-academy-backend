import {
    Injectable,
} from "@nestjs/common"
import {
    FoundationTagEntity,
} from "../entities/foundation-tag.entity"
import {
    FoundationEntity,
} from "../entities/foundation.entity"
import {
    Locale,
} from "../enums/locale"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Applies translations to a foundation row and its tags.
 */
export class FoundationResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    transform(
        foundation: FoundationEntity,
        locale: Locale,
        categoryFallbackLocale: Locale,
    ): void {
        const fallbackLocale = foundation.defaultLocale ?? categoryFallbackLocale
        foundation.title = this.translationResolver.resolve(
            {
                translations: foundation.translations,
                field: "title",
                locale,
                fallbackLocale,
            },
        )
        foundation.description = this.translationResolver.resolve(
            {
                translations: foundation.translations,
                field: "description",
                locale,
                fallbackLocale,
            },
        )
        foundation.value = this.translationResolver.resolve(
            {
                translations: foundation.translations,
                field: "value",
                locale,
                fallbackLocale,
            },
        )
        const translatedAuthor = this.translationResolver.resolve(
            {
                translations: foundation.translations,
                field: "author",
                locale,
                fallbackLocale,
            },
        )
        foundation.author = translatedAuthor !== ""
            ? translatedAuthor
            : foundation.author
        delete (foundation as Partial<FoundationEntity>).translations
        if (foundation.tags?.length) {
            foundation.tags = foundation.tags.map((tag) => {
                const tagFallback = tag.defaultLocale ?? fallbackLocale
                const translatedValue = this.translationResolver.resolve(
                    {
                        translations: tag.translations,
                        field: "value",
                        locale,
                        fallbackLocale: tagFallback,
                    },
                )
                tag.value = translatedValue !== ""
                    ? translatedValue
                    : tag.value
                delete (tag as Partial<FoundationTagEntity>).translations
                return tag
            })
        }
    }
}
