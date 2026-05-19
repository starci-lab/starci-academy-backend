import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    FoundationEntity,
} from "@modules/databases"
import {
    ElasticsearchQueryBuilder,
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    FoundationNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    FoundationQuery,
} from "./foundation.query"

@QueryHandler(FoundationQuery)
@Injectable()
export class FoundationHandler
    extends ICQRSHandler<FoundationQuery, FoundationEntity>
    implements IQueryHandler<FoundationQuery, FoundationEntity> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: FoundationQuery,
    ): Promise<FoundationEntity> {
        const {
            request: {
                id,
                displayId,
            },
            locale,
        } = query.params

        if (!id && !displayId) {
            throw new FoundationNotFoundException({
                id,
                displayId,
            })
        }

        const index = this.elasticsearch.indicateName({
            entity: FoundationEntity.name,
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
    ): Promise<FoundationEntity> {
        try {
            const document = await this.elasticsearch.client.get<FoundationEntity>({
                index,
                id: foundationId,
            })
            if (!document._source) {
                throw new FoundationNotFoundException({
                    id: foundationId,
                })
            }
            return document._source
        } catch (error) {
            if (error instanceof FoundationNotFoundException) {
                throw error
            }
            throw new FoundationNotFoundException({
                id: foundationId,
            })
        }
    }

    private async getByDisplayId(
        index: string,
        displayId: string,
    ): Promise<FoundationEntity> {
        const response = await this.elasticsearch.client.search<FoundationEntity>({
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
            throw new FoundationNotFoundException({
                displayId,
            })
        }
        return hit
    }
}
