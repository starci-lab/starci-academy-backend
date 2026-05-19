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
    ConsultantQuery,
} from "./consultant.query"

@QueryHandler(ConsultantQuery)
@Injectable()
export class ConsultantHandler
    extends ICQRSHandler<ConsultantQuery, ConsultantEntity>
    implements IQueryHandler<ConsultantQuery, ConsultantEntity> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
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

        if (id) {
            return this.getById(
                index,
                id,
            )
        }

        return this.getByDisplayId(
            index,
            displayId!,
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
                            "displayId.keyword": displayId,
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
