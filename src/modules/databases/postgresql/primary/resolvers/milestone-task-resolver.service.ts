import {
    Injectable,
} from "@nestjs/common"
import {
    MilestoneTaskBriefEntity,
} from "../entities/milestone-task-brief.entity"
import {
    MilestoneTaskEntity,
} from "../entities/milestone-task.entity"
import {
    Locale,
} from "../enums/locale"
import {
    TranslationResolverService,
} from "./translation.service"
import {
    MilestoneTaskPassCriteriaResolverService,
} from "./milestone-task-pass-criteria-resolver.service"
import {
    MilestoneTaskCodeImplementationResolverService,
} from "./milestone-task-code-implementation-resolver.service"

@Injectable()
/**
 * Applies translations to a milestone task row and its criteria.
 */
export class MilestoneTaskResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly passCriteriaResolver: MilestoneTaskPassCriteriaResolverService,
        private readonly codeImplementationResolver: MilestoneTaskCodeImplementationResolverService,
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

        // SCHEMA V2 per-language briefs: resolve each brief body to the requested locale and drop
        // the raw per-locale translations so the FE receives one clean localized body per language
        // (mirrors the content body resolution) instead of every locale variant.
        if (task.briefs?.length) {
            task.briefs = task.briefs.map(
                (brief) => {
                    const resolved = this.translationResolver.resolve(
                        {
                            translations: brief.translations,
                            field: "body",
                            locale,
                            fallbackLocale: brief.defaultLocale ?? fallbackLocale,
                        },
                    )
                    brief.body = resolved !== ""
                        ? resolved
                        : brief.body
                    delete (brief as Partial<MilestoneTaskBriefEntity>).translations
                    return brief
                },
            )
        }

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

        if (task.codeImplementations?.length) {
            task.codeImplementations = task.codeImplementations.map(
                (codeImplementation) => {
                    this.codeImplementationResolver.transform(
                        codeImplementation,
                        locale,
                        fallbackLocale,
                    )
                    return codeImplementation
                },
            )
        }
    }
}
