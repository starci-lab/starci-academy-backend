import {
    Injectable,
} from "@nestjs/common"
import {
    CodeImplementationEntity,
} from "../entities/code-implementation.entity"
import {
    Locale,
} from "../enums/locale"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Applies translations to a code implementation row.
 */
export class CodeImplementationResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) { }

    transform(
        codeImplementation: CodeImplementationEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
        const rowFallback = codeImplementation.defaultLocale ?? fallbackLocale
        codeImplementation.guide = this.translationResolver.resolve(
            {
                translations: codeImplementation.translations,
                field: "guide",
                locale,
                fallbackLocale: rowFallback,
            },
        )
        codeImplementation.example = this.translationResolver.resolve(
            {
                translations: codeImplementation.translations,
                field: "example",
                locale,
                fallbackLocale: rowFallback,
            },
        )
        delete (codeImplementation as Partial<CodeImplementationEntity>).translations
    }
}
