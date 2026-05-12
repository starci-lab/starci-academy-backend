import {
    Injectable,
} from "@nestjs/common"
import {
    MilestoneTaskEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"
import {
    MilestoneTaskPassCriteriaResolverService,
} from "./milestone-task-pass-criteria-resolver.service"

/**
 * Applies translations to a milestone task row and its criteria.
 */
@Injectable()
export class MilestoneTaskResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly passCriteriaResolver: MilestoneTaskPassCriteriaResolverService,
    ) {}

    transform(
        task: MilestoneTaskEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
        task.title = this.translationResolver.resolve(
            {
                translations: task.translations,
                field: "title",
                locale,
                fallbackLocale,
            },
        )
        task.description = this.translationResolver.resolve(
            {
                translations: task.translations,
                field: "description",
                locale,
                fallbackLocale,
            },
        )
        task.hint = this.translationResolver.resolve(
            {
                translations: task.translations,
                field: "hint",
                locale,
                fallbackLocale,
            },
        )
        delete (task as Partial<MilestoneTaskEntity>).translations

        if (task.criterias?.length) {
            task.criterias = task.criterias.map(
                (criteria) => {
                    this.passCriteriaResolver.transform(
                        criteria,
                        locale,
                        fallbackLocale,
                    )
                    return criteria
                },
            )
        }
    }
}
