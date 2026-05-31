import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeEntity,
    ChallengeOutputEntity,
    ChallengePrerequisiteEntity,
    ChallengeRequirementEntity,
    ChallengeReferenceEntity,
    ChallengeStepEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

/**
 * Applies translations to a challenge and nested steps and references for CDN materialization.
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
                const fallback = requirement.defaultLocale ?? challengeFallback
                requirement.purpose = this.translationResolver.resolve(
                    {
                        translations: requirement.translations,
                        field: "purpose",
                        locale,
                        fallbackLocale: fallback,
                    },
                )
                requirement.technicalConstraints = this.translationResolver.resolve(
                    {
                        translations: requirement.translations,
                        field: "technicalConstraints",
                        locale,
                        fallbackLocale: fallback,
                    },
                )
                requirement.proTipsHints = this.translationResolver.resolve(
                    {
                        translations: requirement.translations,
                        field: "proTipsHints",
                        locale,
                        fallbackLocale: fallback,
                    },
                )
                requirement.forbidden = this.translationResolver.resolve(
                    {
                        translations: requirement.translations,
                        field: "forbidden",
                        locale,
                        fallbackLocale: fallback,
                    },
                )
                delete (requirement as Partial<ChallengeRequirementEntity>).translations
                return requirement
            })
        }
        if (challenge.outputs?.length) {
            challenge.outputs = challenge.outputs.map((output) => {
                const fallback = output.defaultLocale ?? challengeFallback
                output.text = this.translationResolver.resolve(
                    {
                        translations: output.translations,
                        field: "text",
                        locale,
                        fallbackLocale: fallback,
                    },
                )
                delete (output as Partial<ChallengeOutputEntity>).translations
                return output
            })
        }
        if (challenge.prerequisites?.length) {
            challenge.prerequisites = challenge.prerequisites.map((prerequisite) => {
                const fallback = prerequisite.defaultLocale ?? challengeFallback
                prerequisite.text = this.translationResolver.resolve(
                    {
                        translations: prerequisite.translations,
                        field: "text",
                        locale,
                        fallbackLocale: fallback,
                    },
                )
                delete (prerequisite as Partial<ChallengePrerequisiteEntity>).translations
                return prerequisite
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
                step.body = this.translationResolver.resolve(
                    {
                        translations: step.translations,
                        field: "body",
                        locale,
                        fallbackLocale: stepFallback,
                    },
                )
                delete (step as Partial<ChallengeStepEntity>).translations
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
                delete (reference as Partial<ChallengeReferenceEntity>).translations
                return reference
            })
        }

        if (challenge.requirementsV2?.length) {
            challenge.requirementsV2 = challenge.requirementsV2.map((requirement) => {
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
        if (challenge.stepsV2?.length) {
            challenge.stepsV2 = challenge.stepsV2.map((step) => {
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
        if (challenge.outputsV2?.length) {
            challenge.outputsV2 = challenge.outputsV2.map((output) => {
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
        if (challenge.prerequisitesV2?.length) {
            challenge.prerequisitesV2 = challenge.prerequisitesV2.map((prerequisite) => {
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
