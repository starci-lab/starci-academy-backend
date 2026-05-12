import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    MilestoneEntity,
} from "@modules/databases"
import {
    ElasticsearchQueryBuilder,
    ElasticsearchService,
} from "@modules/elasticsearch"
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
} from "./graphql-types"

@QueryHandler(MilestonesQuery)
@Injectable()
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
                        "courseId.keyword": courseId,
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
                    orderIndex: {
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
