import {
    ChallengeEntity,
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
export class ElasticsearchChallengesSyncService extends BaseElasticsearchSyncService<ChallengeEntity> {
    constructor(
        elasticsearchService: ElasticsearchService,
        @InjectPrimaryPostgreSQLEntityManager()
        entityManager: EntityManager,
    ) {
        super(elasticsearchService, entityManager)
    }

    protected get entityType() { return ChallengeEntity }
    protected get indexName() { return ElasticsearchIndices.challenges }
    protected get relations() {
        return {
            steps: true,
            references: true,
            translations: true,
            submissions: true,
            module: {
                course: true,
            },
        }
    }

    @Interval(envConfig().services.elasticsearchSynchronizer.syncIntervalMs.challenges)
    async handleSyncInterval() {
        await this.syncAll()
    }
}

