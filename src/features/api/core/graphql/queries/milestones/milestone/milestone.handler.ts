import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    MilestoneNotFoundException,
} from "@modules/platform/exceptions/errors/courses/milestone-not-found"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    MilestoneQuery,
} from "./milestone.query"

@QueryHandler(MilestoneQuery)
@Injectable()
/**
 * Loads one fully-hydrated milestone (tasks + criteria + code implementations)
 * from the per-locale Elasticsearch document -- no DB hop for the detail page.
 */
export class MilestoneHandler
    extends ICQRSHandler<MilestoneQuery, MilestoneEntity>
    implements IQueryHandler<MilestoneQuery, MilestoneEntity> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: MilestoneQuery,
    ): Promise<MilestoneEntity> {
        const {
            request: {
                id,
            },
            locale,
        } = query.params

        // Per-locale index already holds fully-localized milestone documents; the ES sync
        // builder embeds the entire hydrated task tree (tasks + criterias + codeImplementations),
        // so a single document get returns everything the milestone detail page needs -- no DB hop.
        const index = this.elasticsearch.indicateName({
            entity: MilestoneEntity.name,
            locale,
        })

        try {
            // documents are indexed with the entity id as the ES `_id`, so a direct get is enough
            const document = await this.elasticsearch.client.get<MilestoneEntity>({
                index,
                id,
            })
            if (!document._source) {
                throw new MilestoneNotFoundException({
                    id,
                })
            }
            return document._source
        } catch (error) {
            if (error instanceof MilestoneNotFoundException) {
                throw error
            }
            throw new MilestoneNotFoundException({
                id,
                originalError: error,
            })
        }
    }
}
