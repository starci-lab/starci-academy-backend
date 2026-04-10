import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeEntity,
    Locale,
    TranslationResolverService,
} from "@modules/databases"

/**
 * Applies translations to a challenge and nested steps and references.
 */
@Injectable()
export class ChallengeTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    /**
     * Applies translations to a challenge and nested steps and references.
     * @param challenge - The challenge to transform.
     * @param locale - The locale to transform the challenge to.
     * @param parentFallbackLocale - The fallback locale to use for the challenge.
     * @returns void.
     */
    transform(
        challenge: ChallengeEntity,
        locale: Locale,
        parentFallbackLocale: Locale,
    ): void {
        const challengeFallback = challenge.defaultLocale ?? parentFallbackLocale
        challenge.title = this.translationResolver.resolve(
            {
                translations: challenge.translations,
                field: "title",
                locale,
                fallbackLocale: challengeFallback,
            },
        )
        challenge.prerequisites = this.translationResolver.resolve(
            {
                translations: challenge.translations,
                field: "prerequisites",
                locale,
                fallbackLocale: challengeFallback,
            },
        )
        challenge.description = this.translationResolver.resolve(
            {
                translations: challenge.translations,
                field: "description",
                locale,
                fallbackLocale: challengeFallback,
            },
        )
        challenge.requirements = this.translationResolver.resolve(
            {
                translations: challenge.translations,
                field: "requirements",
                locale,
                fallbackLocale: challengeFallback,
            },
        )
        if (challenge.steps?.length) {
            challenge.steps = challenge.steps.map((step) => {
                const stepFallback = step.defaultLocale ?? challengeFallback
                step.title = this.translationResolver.resolve(
                    {
                        translations: step.translations,
                        field: "title",
                        locale,
                        fallbackLocale: stepFallback,
                    },
                )
                step.body = this.translationResolver.resolve(
                    {
                        translations: step.translations,
                        field: "body",
                        locale,
                        fallbackLocale: stepFallback,
                    },
                )
                return step
            })
        }
        if (challenge.references?.length) {
            challenge.references = challenge.references.map((reference) => {
                const refFallback = reference.defaultLocale ?? challengeFallback
                const translatedAlias = this.translationResolver.resolve(
                    {
                        translations: reference.translations,
                        field: "alias",
                        locale,
                        fallbackLocale: refFallback,
                    },
                )
                reference.alias = translatedAlias !== ""
                    ? translatedAlias
                    : reference.alias
                return reference
            })
        }
    }
}
