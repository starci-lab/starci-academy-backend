import {
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    Interval,
} from "@nestjs/schedule"
import {
    EntityManager,
} from "typeorm"
import {
    BaseElasticsearchSyncService,
} from "./base.service"
import {
    ElasticsearchIndices,
} from "./indices"

@Injectable()
export class ElasticsearchContentsSyncService extends BaseElasticsearchSyncService<ContentEntity> {
    constructor(
        elasticsearchService: ElasticsearchService,
        @InjectPrimaryPostgreSQLEntityManager()
        entityManager: EntityManager,
    ) {
        super(elasticsearchService, entityManager)
    }

    protected get entityType() { return ContentEntity }
    protected get indexName() { return ElasticsearchIndices.contents }
    protected get relations() {
        return {
            translations: true,
            references: true,
            module: {
                course: true,
            },
        }
    }

    @Interval(envConfig().services.elasticsearchSynchronizer.syncIntervalMs.contents)
    async handleSyncInterval() {
        await this.syncAll()
    }
}

