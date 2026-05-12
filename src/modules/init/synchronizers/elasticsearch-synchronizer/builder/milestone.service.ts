import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    MilestoneEntity,
    MilestoneTaskEntity,
    MilestoneResolverService,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import _ from "lodash"

/**
 * Loads a milestone (with tasks + criteria) from PostgreSQL and materializes **per-locale** plain objects
 * for Elasticsearch JSON.
 */
@Injectable()
export class ElasticsearchMilestoneBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly milestoneResolver: MilestoneResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed milestone tree.
     */
    async buildMultilingualByMilestoneId(
        milestoneId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<MilestoneEntity>>> {
        const hydratedMilestone = await this.loadHydratedMilestonePlain(
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

    /**
     * Loads the hydrated milestone plain object from PostgreSQL.
     * Separately queries tasks (with translations + criteria translations) like module queries previewContents.
     */
    private async loadHydratedMilestonePlain(
        id: string,
    ): Promise<MilestoneEntity> {
        const milestoneRow = await this.entityManager.findOneOrFail(
            MilestoneEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        const hydratedMilestone = milestoneRow.toPlain<MilestoneEntity>()
        const tasks = await this.entityManager.find(
            MilestoneTaskEntity,
            {
                where: {
                    milestone: {
                        id: hydratedMilestone.id,
                    },
                },
                relations: {
                    translations: true,
                    criterias: {
                        translations: true,
                    },
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        hydratedMilestone.tasks = tasks.map(
            (
                task,
            ) => task.toPlain<MilestoneTaskEntity>()
        )
        return hydratedMilestone
    }

    /**
     * Builds the index by milestone id.
     */
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
