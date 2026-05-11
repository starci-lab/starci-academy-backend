import {
    Injectable,
} from "@nestjs/common"
import {
    MilestoneTaskCriteriaEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

/**
 * Applies translations to a milestone task criteria row.
 */
@Injectable()
export class MilestoneTaskPassCriteriaResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    transform(
        criteria: MilestoneTaskCriteriaEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
        criteria.text = this.translationResolver.resolve(
            {
                translations: criteria.translations,
                field: "text",
                locale,
                fallbackLocale,
            },
        )
        criteria.hint = this.translationResolver.resolve(
            {
                translations: criteria.translations,
                field: "hint",
                locale,
                fallbackLocale,
            },
        )
        criteria.promptText = this.translationResolver.resolve(
            {
                translations: criteria.translations,
                field: "promptText",
                locale,
                fallbackLocale,
            },
        )
        delete (criteria as Partial<MilestoneTaskCriteriaEntity>).translations
    }
}
