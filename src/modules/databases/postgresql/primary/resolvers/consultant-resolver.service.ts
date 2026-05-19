import {
    Injectable,
} from "@nestjs/common"
import {
    ConsultantEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"
import {
    HeadhuntingCompanyResolverService,
} from "./headhunting-company-resolver.service"

@Injectable()
export class ConsultantResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly headhuntingCompanyResolver: HeadhuntingCompanyResolverService,
    ) {}

    transform(
        consultant: ConsultantEntity,
        locale: Locale,
        companyFallbackLocale?: Locale,
    ): void {
        const fallbackLocale = consultant.defaultLocale
            ?? companyFallbackLocale
            ?? Locale.En
        consultant.fullName = this.translationResolver.resolve({
            translations: consultant.translations,
            field: "fullName",
            locale,
            fallbackLocale,
        })
        consultant.jobTitle = this.translationResolver.resolve({
            translations: consultant.translations,
            field: "jobTitle",
            locale,
            fallbackLocale,
        })
        consultant.description = this.translationResolver.resolve({
            translations: consultant.translations,
            field: "description",
            locale,
            fallbackLocale,
        })
        if (consultant.company) {
            this.headhuntingCompanyResolver.transform(
                consultant.company,
                locale,
            )
        }
        delete (consultant as Partial<ConsultantEntity>).translations
    }
}
