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
    HeadhuntingCompanyNotFoundException,
} from "@modules/platform/exceptions/errors/courses/headhunting-company-not-found"
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
    HeadhunterCompanyQuery,
} from "./headhunting-company.query"

@QueryHandler(HeadhunterCompanyQuery)
@Injectable()
/**
 * Handles the single headhunting company lookup query (by `id` or
 * `displayId`, Elasticsearch), then gates any nested consultants' contact
 * fields by the viewer's best CV score.
 */
export class HeadhuntingCompanyHandler
    extends ICQRSHandler<HeadhunterCompanyQuery, HeadhuntingCompanyEntity>
    implements IQueryHandler<HeadhunterCompanyQuery, HeadhuntingCompanyEntity> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        private readonly consultantContactGateService: ConsultantContactGateService,
    ) {
        super()
    }

    protected override async process(
        query: HeadhunterCompanyQuery,
    ): Promise<HeadhuntingCompanyEntity> {
        const {
            request: {
                id,
                displayId,
            },
            locale,
            user,
        } = query.params

        if (!id && !displayId) {
            throw new HeadhuntingCompanyNotFoundException({
                id,
                displayId,
            })
        }

        const index = this.elasticsearch.indicateName({
            entity: HeadhuntingCompanyEntity.name,
            locale,
        })

        const company = id
            ? await this.getById(
                index,
                id,
            )
            : await this.getByDisplayId(
                index,
                displayId!,
            )

        // defense in depth: gate any nested consultants this company document
        // carries (the ES mapping does not currently embed them, but a future
        // sync change could), same rule as the standalone consultant(s) queries
        if (company.consultants?.length) {
            const bestCvScore = await this.consultantContactGateService.getBestCvScore({
                userId: user?.id,
            })
            this.consultantContactGateService.gateConsultants(
                company.consultants,
                bestCvScore,
            )
        }

        return company
    }

    private async getById(
        index: string,
        foundationId: string,
    ): Promise<HeadhuntingCompanyEntity> {
        try {
            const document = await this.elasticsearch.client.get<HeadhuntingCompanyEntity>({
                index,
                id: foundationId,
            })
            if (!document._source) {
                throw new HeadhuntingCompanyNotFoundException({
                    id: foundationId,
                })
            }
            return document._source
        } catch (error) {
            if (error instanceof HeadhuntingCompanyNotFoundException) {
                throw error
            }
            throw new HeadhuntingCompanyNotFoundException({
                id: foundationId,
            })
        }
    }

    private async getByDisplayId(
        index: string,
        displayId: string,
    ): Promise<HeadhuntingCompanyEntity> {
        const response = await this.elasticsearch.client.search<HeadhuntingCompanyEntity>({
            index,
            query: ElasticsearchQueryBuilder.buildSearchQuery({
                filters: [
                    {
                        term: {
                            // displayId is mapped as a pure keyword -> query it directly (no `.keyword` subfield)
                            displayId,
                        },
                    },
                ],
            }),
            size: 1,
        })
        const hit = response.hits.hits[0]?._source
        if (!hit) {
            throw new HeadhuntingCompanyNotFoundException({
                displayId,
            })
        }
        return hit
    }
}
