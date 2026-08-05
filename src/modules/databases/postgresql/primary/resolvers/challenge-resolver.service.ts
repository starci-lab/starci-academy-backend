import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeEntity,
} from "../entities/challenge.entity"
import {
    Locale,
} from "../enums/locale"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Applies translations to a challenge and its nested SCHEMA V2 items
 * (requirements/steps/outputs/prerequisites) for CDN materialization.
 */
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
        challenge.description = this.translationResolver.resolve(
            {
                translations: challenge.translations,
                field: "description",
                locale,
                fallbackLocale: challengeFallback,
            },
        )
        delete (challenge as Partial<ChallengeEntity>).translations

        if (challenge.requirements?.length) {
            challenge.requirements = challenge.requirements.map((requirement) => {
                const requirementFallback = requirement.defaultLocale ?? challengeFallback
                requirement.langs = requirement.langs.map(
                    (lang) => {
                        const langFallback = lang.defaultLocale ?? requirementFallback
                        const canonicalTitle = lang.title ?? ""
                        const canonicalBody = lang.body ?? ""
                        lang.title = this.translationResolver.resolve(
                            {
                                translations: lang.translations,
                                field: "title",
                                locale,
                                fallbackLocale: langFallback,
                            },
                        ) || canonicalTitle
                        lang.body = this.translationResolver.resolve(
                            {
                                translations: lang.translations,
                                field: "body",
                                locale,
                                fallbackLocale: langFallback,
                            },
                        ) || canonicalBody
                        delete (lang as Partial<typeof lang>).translations
                        return lang
                    },
                )
                return requirement
            })
        }
        if (challenge.steps?.length) {
            challenge.steps = challenge.steps.map((step) => {
                const stepFallback = step.defaultLocale ?? challengeFallback
                step.langs = step.langs.map((lang) => {
                    const langFallback = lang.defaultLocale ?? stepFallback
                    const canonicalTitle = lang.title ?? ""
                    const canonicalBody = lang.body ?? ""
                    lang.title = this.translationResolver.resolve(
                        {
                            translations: lang.translations,
                            field: "title",
                            locale,
                            fallbackLocale: langFallback,
                        },
                    ) || canonicalTitle
                    lang.body = this.translationResolver.resolve(
                        {
                            translations: lang.translations,
                            field: "body",
                            locale,
                            fallbackLocale: langFallback,
                        },
                    ) || canonicalBody
                    delete (lang as Partial<typeof lang>).translations
                    return lang
                })
                return step
            })
        }
        if (challenge.outputs?.length) {
            challenge.outputs = challenge.outputs.map((output) => {
                const outputFallback = output.defaultLocale ?? challengeFallback
                output.langs = output.langs.map((lang) => {
                    const langFallback = lang.defaultLocale ?? outputFallback
                    const canonicalText = lang.text ?? ""
                    lang.text = this.translationResolver.resolve(
                        {
                            translations: lang.translations,
                            field: "text",
                            locale,
                            fallbackLocale: langFallback,
                        },
                    ) || canonicalText
                    delete (lang as Partial<typeof lang>).translations
                    return lang
                })
                return output
            })
        }
        if (challenge.prerequisites?.length) {
            challenge.prerequisites = challenge.prerequisites.map((prerequisite) => {
                const prerequisiteFallback = prerequisite.defaultLocale ?? challengeFallback
                prerequisite.langs = prerequisite.langs.map((lang) => {
                    const langFallback = lang.defaultLocale ?? prerequisiteFallback
                    const canonicalText = lang.text ?? ""
                    lang.text = this.translationResolver.resolve(
                        {
                            translations: lang.translations,
                            field: "text",
                            locale,
                            fallbackLocale: langFallback,
                        },
                    ) || canonicalText
                    delete (lang as Partial<typeof lang>).translations
                    return lang
                })
                return prerequisite
            })
        }
    }
}
