import {
    CourseEntity,
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
export class ElasticsearchCoursesSyncService extends BaseElasticsearchSyncService<CourseEntity> {
    constructor(
        elasticsearchService: ElasticsearchService,
        @InjectPrimaryPostgreSQLEntityManager()
        entityManager: EntityManager,
    ) {
        super(elasticsearchService, entityManager)
    }

    protected get entityType() { return CourseEntity }
    protected get indexName() { return ElasticsearchIndices.courses }
    protected get relations() {
        return {
            metadata: true,
            pricingPhases: true,
            prerequisites: true,
            valuePropositions: true,
            qnas: true,
            translations: true,
            livestreamSessions: true,
            modules: {
                contents: {
                    translations: true,
                    references: true,
                },
                previewContents: {
                    translations: true,
                },
                translations: true,
                lessonVideos: {
                    translations: true,
                },
                submissions: true,
                challenges: {
                    steps: true,
                    references: true,
                    translations: true,
                    submissions: true,
                },
            },
        }
    }

    @Interval(envConfig().services.elasticsearchSynchronizer.syncIntervalMs.courses)
    async handleSyncInterval() {
        await this.syncAll()
    }
}

