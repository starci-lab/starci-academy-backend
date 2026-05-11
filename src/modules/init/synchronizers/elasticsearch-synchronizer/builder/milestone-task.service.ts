import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    MilestoneTaskEntity,
    MilestoneTaskResolverService,
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
 * Loads a milestone task (with criteria) from PostgreSQL and materializes **per-locale** plain objects
 * for Elasticsearch JSON.
 */
@Injectable()
export class ElasticsearchMilestoneTaskBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly milestoneTaskResolver: MilestoneTaskResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed milestone task tree.
     */
    async buildMultilingualByMilestoneTaskId(
        milestoneTaskId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<MilestoneTaskEntity>>> {
        const hydratedTask = await this.loadHydratedMilestoneTaskPlain(
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

    /**
     * Loads the hydrated milestone task plain object from PostgreSQL.
     */
    private async loadHydratedMilestoneTaskPlain(
        id: string,
    ): Promise<MilestoneTaskEntity> {
        const taskRow = await this.entityManager.findOneOrFail(
            MilestoneTaskEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                    criterias: {
                        translations: true,
                    },
                },
            },
        )
        return taskRow.toPlain<MilestoneTaskEntity>()
    }

    /**
     * Builds the index by milestone task id.
     */
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
