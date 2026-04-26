import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

/**
 * Applies translations to a challenge and nested steps and references.
 */
@Injectable()
export class ChallengeResolverService {
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
