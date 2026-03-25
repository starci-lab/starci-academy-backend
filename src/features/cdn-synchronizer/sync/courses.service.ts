import {
    CourseEntity,
    InjectPrimaryPostgresqlEntityManager 
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import {
    S3UploadService 
} from "@modules/s3"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    Injectable,
    OnApplicationBootstrap
} from "@nestjs/common"
import {
    Interval 
} from "@nestjs/schedule"
import {
    EntityManager 
} from "typeorm"

/**
 * Service for syncing courses to S3.
 */
@Injectable()
export class CoursesSyncService implements OnApplicationBootstrap {
    constructor(
        private readonly s3UploadService: S3UploadService,
        @InjectPrimaryPostgresqlEntityManager()
        private readonly entityManager: EntityManager,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * On application bootstrap.
     */
    async onApplicationBootstrap() {
        await this.sync()
    }

    /**
     * Sync courses to S3.
     */
    async sync() {
        try {
            const courses = await this.entityManager.find(
                CourseEntity,
                {
                    relations: {
                        prerequisites: true,
                        qnas: true,
                        modules: {
                            contents: true,
                            exclusiveLessonVideos: true,
                            outcomes: true,
                            submissions: true,
                        },
                    },
                }
            )
            const coursesJson = JSON.stringify(courses)
            await this.s3UploadService.json(
                "courses",
                coursesJson
            )
        } catch (error) {
            this.winstonService.log(
                WinstonLog.CdnSynchronizerCoursesSyncFailed,
                {
                    error:  error.message,
                }
            )
        }
    }

    /**
     * Sync courses to S3 every interval.
     */
    @Interval(envConfig().services.cdnSynchronizer.syncIntervalMs.courses)
    async handleSyncInterval() {
        await this.sync()
    }
}

