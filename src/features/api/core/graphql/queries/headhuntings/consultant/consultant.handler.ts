import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ConsultantEntity,
} from "@modules/databases"
import {
    ElasticsearchQueryBuilder,
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    ConsultantNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ConsultantContactGateService,
} from "@modules/bussiness"
import {
    ConsultantQuery,
} from "./consultant.query"

@QueryHandler(ConsultantQuery)
@Injectable()
/**
 * Handles the single Headhunter lookup query (by `id` or `displayId`,
 * Elasticsearch), then gates the resolved consultant's contact fields by the
 * viewer's best CV score.
 */
export class ConsultantHandler
    extends ICQRSHandler<ConsultantQuery, ConsultantEntity>
    implements IQueryHandler<ConsultantQuery, ConsultantEntity> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        private readonly consultantContactGateService: ConsultantContactGateService,
    ) {
        super()
    }

    protected override async process(
        query: ConsultantQuery,
    ): Promise<ConsultantEntity> {
        const {
            request: {
                id,
                displayId,
            },
            locale,
            user,
        } = query.params

        if (!id && !displayId) {
            throw new ConsultantNotFoundException({
                id,
                displayId,
            })
        }

        const index = this.elasticsearch.indicateName({
            entity: ConsultantEntity.name,
            locale,
        })

        const consultant = id
            ? await this.getById(
                index,
                id,
            )
            : await this.getByDisplayId(
                index,
                displayId!,
            )

        // gate contact fields server-side by the viewer's best CV score;
        // anonymous viewers (user undefined) resolve to a score of 0 (locked)
        const bestCvScore = await this.consultantContactGateService.getBestCvScore({
            userId: user?.id,
        })
        return this.consultantContactGateService.gateConsultant(
            consultant,
            bestCvScore,
        )
    }

    private async getById(
        index: string,
        foundationId: string,
    ): Promise<ConsultantEntity> {
        try {
            const document = await this.elasticsearch.client.get<ConsultantEntity>({
                index,
                id: foundationId,
            })
            if (!document._source) {
                throw new ConsultantNotFoundException({
                    id: foundationId,
                })
            }
            return document._source
        } catch (error) {
            if (error instanceof ConsultantNotFoundException) {
                throw error
            }
            throw new ConsultantNotFoundException({
                id: foundationId,
            })
        }
    }

    private async getByDisplayId(
        index: string,
        displayId: string,
    ): Promise<ConsultantEntity> {
        const response = await this.elasticsearch.client.search<ConsultantEntity>({
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
            throw new ConsultantNotFoundException({
                displayId,
            })
        }
        return hit
    }
}
