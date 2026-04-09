import {
    ContentEntity,
    Locale
} from "@modules/databases"
import { 
    ElasticsearchQueryBuilder, 
    ElasticsearchService 
} from "@modules/elasticsearch"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    ExecuteParams,
} from "../../../../types"
import {
    ContentTransformerService,
} from "../../../utils"
import {
    ContentsRequest,
    ContentsResponseData
} from "./graphql-types"

/**
 * Lists module contents from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class ContentsService {
    constructor(
        private readonly contentTransformer: ContentTransformerService,
        private readonly  elasticsearch: ElasticsearchService,
    ) {}

    async execute(
        {
            request: {
                moduleId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                    search
                },
            },
            locale,
        }: ExecuteParams<ContentsRequest>,
    ): Promise<ContentsResponseData> {
        const sort = sorts.map(s => ({
            [s.by]: {order: s.order.toLowerCase()},
        }))
        const query = ElasticsearchQueryBuilder.buildSearchQuery({
            filters: [
                {
                    term: {
                        "moduleId.keyword": moduleId,
                    },
                },
            ],
            search,
            searchFields: ["title^3", "description", "body"],
        });

        const { data, count } = await this.elasticsearch.search<ContentEntity>(
            ContentEntity.name,
            {
                query,
                sort,
                from: pageNumber * limit,
                size: limit,
            },
        )

        for (const content of data) {
          this.contentTransformer.transform(
            content,
            locale,
            content.defaultLocale ?? Locale.En,
          );
        }

        return {
            count,
            data,
        }
    }
}
