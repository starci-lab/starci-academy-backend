import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    HeadhuntingCompanyEntity,
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
    HeadhunterCompaniesQuery,
} from "./headhunting-companies.query"

/**
 * Lists headhunting companies from Elasticsearch (locale index).
 */
@QueryHandler(HeadhunterCompaniesQuery)
@Injectable()
export class HeadhuntingCompaniesHandler
    extends ICQRSHandler<HeadhunterCompaniesQuery, Array<HeadhuntingCompanyEntity>>
    implements IQueryHandler<HeadhunterCompaniesQuery, Array<HeadhuntingCompanyEntity>> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: HeadhunterCompaniesQuery,
    ): Promise<Array<HeadhuntingCompanyEntity>> {
        const {
            locale,
        } = query.params

        const esQuery = ElasticsearchQueryBuilder.buildSearchQuery({
        })

        const response = await this.elasticsearch.client.search<HeadhuntingCompanyEntity>({
            index: this.elasticsearch.indicateName({
                entity: HeadhuntingCompanyEntity.name,
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

        return response.hits.hits.map(
            (hit) => hit._source as HeadhuntingCompanyEntity,
        )
    }
}
