import {
    Injectable,
} from "@nestjs/common"
import {
    PrerequisiteEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Applies translations to a course prerequisite row.
 */
export class PrerequisiteResolverService {
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
        delete (prerequisite as Partial<PrerequisiteEntity>).translations
    }
}
