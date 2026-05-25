import {
    Locale,
    MilestoneTaskEntity,
    MilestoneTaskHydrationService,
    MilestoneTaskResolverService,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import _ from "lodash"

@Injectable()
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
                return {
                    locale,
                    entity: localizedTask,
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
