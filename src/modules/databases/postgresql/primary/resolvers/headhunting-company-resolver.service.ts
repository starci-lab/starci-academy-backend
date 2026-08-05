import {
    Injectable,
} from "@nestjs/common"
import {
    HeadhuntingCompanyEntity,
} from "../entities/headhunting-company.entity"
import {
    Locale,
} from "../enums/locale"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Overwrites company title/description in-place with locale-resolved strings
 * and strips translations/consultants so GraphQL returns a flat display shape.
 */
export class HeadhuntingCompanyResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    transform(
        company: HeadhuntingCompanyEntity,
        locale: Locale,
    ): void {
        const fallbackLocale = company.defaultLocale
        company.title = this.translationResolver.resolve({
            translations: company.translations,
            field: "title",
            locale,
            fallbackLocale,
        })
        company.description = this.translationResolver.resolve({
            translations: company.translations,
            field: "description",
            locale,
            fallbackLocale,
        })
        delete (company as Partial<HeadhuntingCompanyEntity>).translations
        delete (company as Partial<HeadhuntingCompanyEntity>).consultants
    }
}
