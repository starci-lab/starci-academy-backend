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

        const response = await this.elasticsearch.client.search<ModuleEntity>({
            index: this.elasticsearch.indicateName({
                entity: ModuleEntity.name,
                locale,
            }),
            query: esQuery,
            sort: [
                {
                    // pure ordering index drives the module list order (editable to reorder)
                    sortIndex: {
                        order: "asc",
                    },
                },
            ],
            size: 1000,
        })
        const data = response.hits.hits.map((hit) => {
            const module = hit._source as ModuleEntity
            return {
                ...module,
                contents: module.contents ?? [],
            }
        })

        return {
            data,
        }
    }
}
