import {
    Injectable,
} from "@nestjs/common"
import {
    ContentEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"
import {
    ChallengeResolverService,
} from "./challenge-resolver.service"
import {
    CodeExplainingResolverService,
} from "./code-explaining-resolver.service"
import {
    CodeImplementationResolverService,
} from "./code-implementation-resolver.service"

/**
 * Applies translations to a content row.
 */
@Injectable()
export class ContentResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly challengeResolver: ChallengeResolverService,
        private readonly codeExplainingResolver: CodeExplainingResolverService,
        private readonly codeImplementationResolver: CodeImplementationResolverService,
    ) {}

    transform(
        content: ContentEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
        content.title = this.translationResolver.resolve(
            {
                translations: content.translations,
                field: "title",
                locale,
                fallbackLocale,
            },
        )
        content.description = this.translationResolver.resolve(
            {
                translations: content.translations,
                field: "description",
                locale,
                fallbackLocale,
            },
        )
        content.body = this.translationResolver.resolve(
            {
                translations: content.translations,
                field: "body",
                locale,
                fallbackLocale,
            },
        )
        delete (content as Partial<ContentEntity>).translations
        const contentFallback = content.defaultLocale ?? fallbackLocale
        content.challenges = (content.challenges ?? []).map((challenge) => {
            this.challengeResolver.transform(
                challenge,
                locale,
                contentFallback,
            )
            return challenge
        })
        content.codeExplainings = (content.codeExplainings ?? []).map((row) => {
            this.codeExplainingResolver.transform(
                row,
                locale,
                contentFallback,
            )
            return row
        })
        content.codeImplementations = (content.codeImplementations ?? []).map((row) => {
            this.codeImplementationResolver.transform(
                row,
                locale,
                contentFallback,
            )
            return row
        })
    }
}
