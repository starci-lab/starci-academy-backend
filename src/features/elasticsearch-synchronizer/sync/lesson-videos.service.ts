import {
    LessonVideoEntity,
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
export class ElasticsearchLessonVideosSyncService extends BaseElasticsearchSyncService<LessonVideoEntity> {
    constructor(
        elasticsearchService: ElasticsearchService,
        @InjectPrimaryPostgreSQLEntityManager()
        entityManager: EntityManager,
    ) {
        super(elasticsearchService,
            entityManager)
    }

    protected get entityType() { return LessonVideoEntity }
    protected get indexName() { return ElasticsearchIndices.lessonVideos }
    protected get relations() {
        return {
            translations: true,
            module: {
                course: true,
            },
        }
    }

    @Interval(envConfig().services.elasticsearchSynchronizer.syncIntervalMs.lessonVideos)
    async handleSyncInterval() {
        await this.syncAll()
    }
}

