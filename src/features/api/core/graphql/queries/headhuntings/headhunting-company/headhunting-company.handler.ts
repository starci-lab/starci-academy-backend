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
    HeadhuntingCompanyNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    HeadhunterCompanyQuery,
} from "./headhunting-company.query"

@QueryHandler(HeadhunterCompanyQuery)
@Injectable()
export class HeadhuntingCompanyHandler
    extends ICQRSHandler<HeadhunterCompanyQuery, HeadhuntingCompanyEntity>
    implements IQueryHandler<HeadhunterCompanyQuery, HeadhuntingCompanyEntity> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
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
                            "displayId.keyword": displayId,
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
