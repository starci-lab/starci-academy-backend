import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    MilestoneEntity,
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
 * Loads a milestone (with tasks + pass criteria + translations) from PostgreSQL
 * and materializes **per-locale** plain objects for Elasticsearch JSON.
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
     */
    private async loadHydratedMilestonePlain(
        id: string,
    ): Promise<MilestoneEntity> {
        const milestoneRow = await this.entityManager.findOne(
            MilestoneEntity,
            {
                where: {
                    id,
                },
                relations: {
                    course: true,
                    translations: true,
                    tasks: {
                        translations: true,
                        passCriteria: {
                            translations: true,
                        },
                    },
                },
                order: {
                    tasks: {
                        orderIndex: "ASC",
                        passCriteria: {
                            orderIndex: "ASC",
                        },
                    },
                },
            },
        )
        if (!milestoneRow) {
            throw new Error(`Milestone not found: ${id}`)
        }
        return milestoneRow.toPlain<MilestoneEntity>()
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
