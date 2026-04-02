import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeEntity,
    Locale,
    TranslationResolverService,
} from "@modules/databases"

/**
 * Applies translations to a challenge and nested inputs, steps, references.
 */
@Injectable()
export class ChallengeTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

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
        challenge.brief = this.translationResolver.resolve(
            {
                translations: challenge.translations,
                field: "brief",
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
        if (challenge.inputs?.length) {
            challenge.inputs = challenge.inputs.map((input) => {
                const inputFallback = input.defaultLocale ?? challengeFallback
                input.description = this.translationResolver.resolve(
                    {
                        translations: input.translations,
                        field: "description",
                        locale,
                        fallbackLocale: inputFallback,
                    },
                )
                return input
            })
        }
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
                step.description = this.translationResolver.resolve(
                    {
                        translations: step.translations,
                        field: "description",
                        locale,
                        fallbackLocale: stepFallback,
                    },
                )
                const translatedBody = this.translationResolver.resolve(
                    {
                        translations: step.translations,
                        field: "body",
                        locale,
                        fallbackLocale: stepFallback,
                    },
                )
                step.body = translatedBody !== ""
                    ? translatedBody
                    : step.body
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
