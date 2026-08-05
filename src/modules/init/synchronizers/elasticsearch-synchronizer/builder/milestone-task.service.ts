import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MilestoneTaskHydrationService,
} from "@modules/databases/postgresql/primary/hydration/milestone-task-hydration.service"
import {
    MilestoneTaskResolverService,
} from "@modules/databases/postgresql/primary/resolvers/milestone-task-resolver.service"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    buildCompletionSuggest,
} from "@modules/integrations/elasticsearch/utils/completion"
import _ from "lodash"

@Injectable()
/**
 * Hydrates a milestone task and indexes **per-locale** ES docs with title
 * completion. Tasks are searchable independently of the parent milestone.
 */
export class ElasticsearchMilestoneTaskBuildService {
    constructor(
        private readonly milestoneTaskHydration: MilestoneTaskHydrationService,
        private readonly milestoneTaskResolver: MilestoneTaskResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    async buildMultilingualByMilestoneTaskId(
        milestoneTaskId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<MilestoneTaskEntity>>> {
        const hydratedTask = await this.milestoneTaskHydration.loadById(
            milestoneTaskId,
        )
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedTask = _.cloneDeep(hydratedTask)
                this.milestoneTaskResolver.transform(
                    localizedTask,
                    locale,
                    hydratedTask.defaultLocale ?? Locale.En,
                )
                // populate the ES completion field: the localized task title as the
                // suggest input (the resolver already swapped in the per-locale title,
                // so no localized wrapper remains to strip), weighted by display order
                // (earlier = more popular) so the FST-backed autocomplete returns
                // clean, ranked suggestions.
                const label = (localizedTask.title ?? "").trim()
                const suggest = buildCompletionSuggest({
                    inputs: label.length > 0 ? [label] : [],
                    weight: Math.max(1,
                        100 - (localizedTask.orderIndex ?? 0)),
                })
                return {
                    locale,
                    entity: Object.assign(
                        localizedTask,
                        {
                            suggest,
                        },
                    ),
                }
            },
        )
    }

    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByMilestoneTaskId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: MilestoneTaskEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
