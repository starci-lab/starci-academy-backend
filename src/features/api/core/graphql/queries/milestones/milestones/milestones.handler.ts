import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    ElasticsearchQueryBuilder,
} from "@modules/integrations/elasticsearch/utils/query-builder"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    MilestonesQuery,
} from "./milestones.query"
import {
    MilestonesResponseData,
} from "./graphql-types/response"

@QueryHandler(MilestonesQuery)
@Injectable()
/**
 * Lists every milestone for a course from the per-locale Elasticsearch index,
 * ordered by `sortIndex` (cap 1000).
 */
export class MilestonesHandler
    extends ICQRSHandler<MilestonesQuery, MilestonesResponseData>
    implements IQueryHandler<MilestonesQuery, MilestonesResponseData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: MilestonesQuery,
    ): Promise<MilestonesResponseData> {
        const {
            request: {
                courseId,
            },
            locale,
        } = query.params

        const esQuery = ElasticsearchQueryBuilder.buildSearchQuery({
            filters: [
                {
                    term: {
                        // courseId is mapped as a pure keyword -> query it directly (no `.keyword` subfield)
                        courseId,
                    },
                },
            ],
        })

        const response = await this.elasticsearch.client.search<MilestoneEntity>({
            index: this.elasticsearch.indicateName({
                entity: MilestoneEntity.name,
                locale,
            }),
            query: esQuery,
            sort: [
                {
                    sortIndex: {
                        order: "asc",
                    },
                },
            ],
            size: 1000,
        })
        const data = response.hits.hits.map((hit) => hit._source as MilestoneEntity)

        return {
            data,
        }
    }
}
