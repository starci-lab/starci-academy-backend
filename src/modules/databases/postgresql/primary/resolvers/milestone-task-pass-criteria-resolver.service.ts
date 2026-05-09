import {
    Injectable,
} from "@nestjs/common"
import {
    MilestoneTaskPassCriteriaEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

/**
 * Applies translations to a milestone task pass criteria row.
 */
@Injectable()
export class MilestoneTaskPassCriteriaResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    transform(
        criteria: MilestoneTaskPassCriteriaEntity,
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
        delete (criteria as Partial<MilestoneTaskPassCriteriaEntity>).translations
    }
}
