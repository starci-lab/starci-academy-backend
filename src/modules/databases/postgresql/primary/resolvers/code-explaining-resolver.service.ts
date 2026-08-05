import {
    Injectable,
} from "@nestjs/common"
import {
    CodeExplainingEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Applies translations to a code explaining row.
 */
export class CodeExplainingResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) { }

    transform(
        codeExplaining: CodeExplainingEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
        const rowFallback = codeExplaining.defaultLocale ?? fallbackLocale
        codeExplaining.code = this.translationResolver.resolve(
            {
                translations: codeExplaining.translations,
                field: "code",
                locale,
                fallbackLocale: rowFallback,
            },
        )
        codeExplaining.explain = this.translationResolver.resolve(
            {
                translations: codeExplaining.translations,
                field: "explain",
                locale,
                fallbackLocale: rowFallback,
            },
        )
        delete (codeExplaining as Partial<CodeExplainingEntity>).translations
    }
}
