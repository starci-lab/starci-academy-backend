import {
    Injectable,
} from "@nestjs/common"
import {
    MilestoneTaskCriteriaEntity,
} from "../entities/milestone-task-criteria.entity"
import {
    Locale,
} from "../enums/locale"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Applies translations to a milestone task criteria row.
 */
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
