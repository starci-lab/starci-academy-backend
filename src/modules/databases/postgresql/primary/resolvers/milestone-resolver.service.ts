import {
    Injectable,
} from "@nestjs/common"
import {
    MilestoneEntity,
} from "../entities/milestone.entity"
import {
    Locale,
} from "../enums/locale"
import {
    TranslationResolverService,
} from "./translation.service"
import {
    MilestoneTaskResolverService,
} from "./milestone-task-resolver.service"

@Injectable()
/**
 * Applies translations to a milestone row and delegates nested tasks.
 */
export class MilestoneResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly taskResolver: MilestoneTaskResolverService,
    ) {}

    transform(
        milestone: MilestoneEntity,
        locale: Locale,
    ): MilestoneEntity {
        const fallbackLocale = milestone.defaultLocale ?? Locale.En

        milestone.title = this.translationResolver.resolve(
            {
                translations: milestone.translations,
                field: "title",
                locale,
                fallbackLocale,
            },
        )
        delete (milestone as Partial<MilestoneEntity>).translations

        if (milestone.tasks?.length) {
            milestone.tasks = milestone.tasks.map(
                (task) => {
                    this.taskResolver.transform(
                        task,
                        locale,
                        fallbackLocale,
                    )
                    return task
                },
            )
        }
        return milestone
    }
}
