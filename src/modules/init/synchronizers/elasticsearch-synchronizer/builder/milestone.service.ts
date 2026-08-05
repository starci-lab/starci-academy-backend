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
    buildCompletionSuggest,
    ElasticsearchService,
} from "@modules/elasticsearch"
import _ from "lodash"

@Injectable()
/**
 * Hydrates a milestone and indexes **per-locale** ES docs with title completion.
 * Capstone search is a separate index from lessons/modules.
 */
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
                // populate the ES completion field: the clean milestone title as the
                // suggest input, weighted by display order (earlier = more popular) so
                // the FST-backed autocomplete returns clean, ranked suggestions.
                const label = (localizedMilestone.title ?? "").trim()
                const suggest = buildCompletionSuggest({
                    inputs: [label],
                    weight: Math.max(
                        1,
                        100 - (localizedMilestone.orderIndex ?? 0),
                    ),
                })
                return {
                    locale,
                    entity: Object.assign(
                        localizedMilestone,
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
