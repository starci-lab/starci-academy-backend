import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    S3BuildService,
    S3UploadService,
    S3ReadService,
} from "@modules/s3"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    InjectSuperJson
} from "@modules/mixin"
import SuperJSON from "superjson"
import {
    EntityManager
} from "typeorm"
import {
    BaseSyncService
} from "./base.service"
import {
    Interval 
} from "@nestjs/schedule"
import {
    envConfig 
} from "@modules/env"

/**
 * Version 2 of the Courses Sync Service.
 * Implements full entity sync (all relations) and a collection manifest.
 */
@Injectable()
export class CoursesSyncV2Service extends BaseSyncService<CourseEntity> implements OnApplicationBootstrap {
    constructor(
        s3UploadService: S3UploadService,
        s3BuildService: S3BuildService,
        s3ReadService: S3ReadService,
        @InjectSuperJson()
        superJson: SuperJSON,
        @InjectPrimaryPostgreSQLEntityManager()
        entityManager: EntityManager,
        winstonService: WinstonService,
    ) {
        super(s3UploadService, s3BuildService, s3ReadService, superJson, entityManager, winstonService)
    }

    protected get entityType() { return CourseEntity }
    protected get keyPrefix() { return "courses-v2" } // Using v2 prefix as requested for testing
    
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
                contents: true,
                previewContents: true,
                translations: true,
                lessonVideos: {
                    translations: true,
                },
                submissions: true,
            },
        }
    }

    /**
     * Run the sync cycle on application bootstrap.
     */
    async onApplicationBootstrap() {
        await this.runSyncCycle()
    }

    /**
     * Run the sync cycle on a regular interval.
     */
    @Interval(envConfig().services.cdnSynchronizer.syncIntervalMs.courses)
    async handleSyncInterval() {
        await this.runSyncCycle()
    }

    /**
     * Retry options for course sync.
     */
    protected get retryOptions() {
        return {
            maxRetries: envConfig().services.cdnSynchronizer.retries.courses.maxRetries,
            retryDelayMs: envConfig().services.cdnSynchronizer.retries.courses.retryDelayMs,
        }
    }

    /**
     * Log a failed sync attempt for a course.
     */
    protected logAttemptFailed(id: string, attempt: number, maxRetries: number) {
        this.winstonService.log(WinstonLog.CdnSynchronizerCourseSyncFailedAttempt, {
            id,
            attempt,
            maxRetries,
        })
    }

    /**
     * Log when maximum retries are reached for a course.
     */
    protected logMaxRetriesReached(id: string, maxRetries: number) {
        this.winstonService.log(WinstonLog.CdnSynchronizerCourseSyncFailedMaxRetriesReached, {
            id,
            maxRetries,
        })
    }

    /**
     * Entity-specific error handling.
     */
    protected handleError(id: string, error: any) {
        this.winstonService.log(WinstonLog.CdnSynchronizerCourseSyncFailed, {
            id,
            error: error.message,
        })
    }
}
