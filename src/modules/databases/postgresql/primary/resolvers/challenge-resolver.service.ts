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
        challenge.description = this.translationResolver.resolve(
            {
                translations: challenge.translations,
                field: "description",
                locale,
                fallbackLocale: challengeFallback,
            },
        )
        delete (challenge as Partial<ChallengeEntity>).translations
        if (challenge.challengeRequirements?.length) {
            challenge.challengeRequirements = challenge.challengeRequirements.map((requirement) => {
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
        if (challenge.challengeOutputs?.length) {
            challenge.challengeOutputs = challenge.challengeOutputs.map((output) => {
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
        if (challenge.challengePrerequisites?.length) {
            challenge.challengePrerequisites = challenge.challengePrerequisites.map((prerequisite) => {
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
        challenge.requirements = (challenge.challengeRequirements ?? [])
            .map((requirement) => [
                `Muc tieu: ${requirement.purpose}`,
                `Rang buoc ky thuat: ${requirement.technicalConstraints}`,
                `Goi y: ${requirement.proTipsHints}`,
                requirement.forbidden ? `Cam: ${requirement.forbidden}` : "",
            ].join("\n"))
            .filter(Boolean)
            .join("\n\n")
        challenge.outputs = (challenge.challengeOutputs ?? [])
            .map((output) => output.text)
            .filter(Boolean)
            .join("\n")
        challenge.prerequisites = (challenge.challengePrerequisites ?? [])
            .map((prerequisite) => prerequisite.text)
            .filter(Boolean)
            .join("\n")
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
                // prevent leaking raw translations arrays to API callers
                delete (reference as Partial<ChallengeReferenceEntity>).translations
                return reference
            })
        }
    }
}
