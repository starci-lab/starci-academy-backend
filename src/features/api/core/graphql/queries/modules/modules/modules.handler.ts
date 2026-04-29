import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ModuleEntity,
} from "@modules/databases"
import {
    ElasticsearchQueryBuilder,
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ModulesQuery,
} from "./modules.query"
import {
    ModulesResponseData,
} from "./graphql-types"
import {
    estypes,
} from "@elastic/elasticsearch"

@QueryHandler(ModulesQuery)
@Injectable()
export class ModulesHandler
    extends ICQRSHandler<ModulesQuery, ModulesResponseData>
    implements IQueryHandler<ModulesQuery, ModulesResponseData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: ModulesQuery,
    ): Promise<ModulesResponseData> {
        const {
            request: {
                courseId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                    search,
                },
            },
            locale,
        } = query.params

        const sort = sorts.map((sort) => ({
            [sort.by]: {
                order: sort.order.toLowerCase() as estypes.SortOrder,
            } as estypes.FieldSort,
        })) as Array<estypes.SortCombinations>

        const esQuery = ElasticsearchQueryBuilder.buildSearchQuery({
            filters: [
                {
                    term: {
                        "courseId.keyword": courseId,
                    },
                },
                {
                    term: {
                        locale,
                    },
                },
            ],
            search,
            searchFields: [
                "title^3",
                "description",
            ],
        })

        const response = await this.elasticsearch.client.search<ModuleEntity>({
            index: this.elasticsearch.indicateName({
                entity: ModuleEntity.name,
                locale,
            }),
            query: esQuery,
            sort,
            from: pageNumber * limit,
            size: limit,
        })
        const total = response.hits.total
        const count = typeof total === "number" ? total : total?.value || 0
        const data = response.hits.hits.map((hit) => hit._source as ModuleEntity)

        return {
            count,
            data,
        }
    }
}
