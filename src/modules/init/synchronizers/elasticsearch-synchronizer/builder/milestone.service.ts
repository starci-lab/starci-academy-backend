import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MilestoneHydrationService,
} from "@modules/databases/postgresql/primary/hydration/milestone-hydration.service"
import {
    MilestoneResolverService,
} from "@modules/databases/postgresql/primary/resolvers/milestone-resolver.service"
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
                const localizedMilestone = structuredClone(hydratedMilestone)
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
