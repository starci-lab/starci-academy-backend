import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
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
    ConsultantContactGateService,
} from "@modules/bussiness/headhuntings/consultant-contact-gate.service"
import {
    HeadhunterCompaniesQuery,
} from "./headhunting-companies.query"

@QueryHandler(HeadhunterCompaniesQuery)
@Injectable()
/**
 * Lists headhunting companies from Elasticsearch (locale index).
 */
export class HeadhuntingCompaniesHandler
    extends ICQRSHandler<HeadhunterCompaniesQuery, Array<HeadhuntingCompanyEntity>>
    implements IQueryHandler<HeadhunterCompaniesQuery, Array<HeadhuntingCompanyEntity>> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        private readonly consultantContactGateService: ConsultantContactGateService,
    ) {
        super()
    }

    protected override async process(
        query: HeadhunterCompaniesQuery,
    ): Promise<Array<HeadhuntingCompanyEntity>> {
        const {
            locale,
            user,
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

        const companies = response.hits.hits.map(
            (hit) => hit._source as HeadhuntingCompanyEntity,
        )

        // defense in depth: gate any nested consultants these company
        // documents carry (the ES mapping does not currently embed them, but
        // a future sync change could), same rule as the standalone
        // consultant(s) queries -- one score lookup shared across the page
        const companiesWithConsultants = companies.filter(
            (company) => company.consultants?.length,
        )
        if (companiesWithConsultants.length) {
            const bestCvScore = await this.consultantContactGateService.getBestCvScore({
                userId: user?.id,
            })
            companiesWithConsultants.forEach(
                (company) => this.consultantContactGateService.gateConsultants(
                    company.consultants,
                    bestCvScore,
                ),
            )
        }

        return companies
    }
}
