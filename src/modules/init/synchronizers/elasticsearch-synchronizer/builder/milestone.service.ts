import {
    Locale,
    MilestoneEntity,
    MilestoneHydrationService,
    MilestoneResolverService,
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
export class ElasticsearchMilestoneBuildService {
    constructor(
        private readonly milestoneHydration: MilestoneHydrationService,
        private readonly milestoneResolver: MilestoneResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    async buildMultilingualByMilestoneId(
        milestoneId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<MilestoneEntity>>> {
        const hydratedMilestone = await this.milestoneHydration.loadById(
            milestoneId,
        )
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedMilestone = _.cloneDeep(hydratedMilestone)
                this.milestoneResolver.transform(
                    localizedMilestone,
                    locale,
                )
                return {
                    locale,
                    entity: localizedMilestone,
                }
            },
        )
    }

    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByMilestoneId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: MilestoneEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
