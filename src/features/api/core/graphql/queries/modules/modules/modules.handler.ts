import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
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
    ModulesQuery,
} from "./modules.query"
import {
    ModulesResponseData,
} from "./graphql-types/response"

@QueryHandler(ModulesQuery)
@Injectable()
/**
 * Lists every module for a course from the per-locale Elasticsearch index,
 * ordered by `sortIndex` (cap 1000 -- courses do not exceed this in practice).
 */
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
                        // courseId is mapped as a pure keyword -> query it directly (no `.keyword` subfield)
                        courseId,
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
        const data = response.hits.hits
            .map((hit) => hit._source)
            // a hit without a stored source cannot be rendered -- drop it rather than emit a hole
            .filter((module): module is ModuleEntity => module !== undefined)
            .map((module) => {
                // the index omits an empty nested array; the GraphQL field is non-null
                module.contents = module.contents ?? []
                return module
            })

        return {
            data,
        }
    }
}
