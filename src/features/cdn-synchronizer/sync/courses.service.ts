import {
    sleep 
} from "@modules/common"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
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
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    Interval 
} from "@nestjs/schedule"
import {
    EntityManager 
} from "typeorm"
import _ from "lodash"
import {
    InjectSuperJson 
} from "@modules/mixin"
import SuperJSON from "superjson"
  
/**
 * Service for synchronizing courses to the CDN.
 */
@Injectable()
export class CoursesSyncService implements OnApplicationBootstrap {
    private isSyncing = false
  
    constructor(
      private readonly s3UploadService: S3UploadService,
      private readonly s3BuildService: S3BuildService,
      private readonly s3ReadService: S3ReadService,
      @InjectSuperJson()
      private readonly superJson: SuperJSON,
      @InjectPrimaryPostgreSQLEntityManager()
      private readonly entityManager: EntityManager,
      private readonly winstonService: WinstonService,
    ) {}
  
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
     * Run the sync cycle.
     */
    private async runSyncCycle() {
        if (this.isSyncing) {
            this.winstonService.log(
                WinstonLog.CdnSynchronizerCoursesSyncing,
                {
                },
            )
            return
        }
        this.isSyncing = true
        try {
            await this.syncSequentially()
        } catch (error) {
            this.winstonService.log(
                WinstonLog.CdnSynchronizerCourseSyncFailed,
                {
                    error: error.message,
                },
            )
        } finally {
            this.isSyncing = false
        }
    }
  
    /**
     * Sync all courses sequentially.
     */
    private async syncSequentially() {
        const courses = await this.entityManager.find(CourseEntity,
            {
                select: ["id"],
                order: {
                    id: "ASC",  
                },
            })
  
        // Iterate through the courses.
        for (const course of courses) {
            // Sync the course with retry.
            const success = await this.syncOneWithRetry(course.id)
            if (success) {
                // Log the successful sync.
                this.winstonService.log(
                    WinstonLog.CdnSynchronizerCourseSyncedSuccessfully,
                    {
                        id: course.id,
                    },
                )
            }
        }
    }
  
    /**
     * Sync one course to S3 and update the database with retry.
     * @param id - The ID of the course to sync.
     * @returns True if the course was synced successfully, false otherwise.
     */
    private async syncOneWithRetry(
        id: string
    ): Promise<boolean> {
        // Retry the sync operation up to a maximum number of times.
        const maxRetries = envConfig().services.cdnSynchronizer.retries.courses.maxRetries
        const retryDelayMs = envConfig().services.cdnSynchronizer.retries.courses.retryDelayMs
        // Iterate through the retry attempts.
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            // Sync the course.
            const cdnUrl = await this.syncOne(id)
  
            if (cdnUrl) {
                // If the course was synced successfully, return true.
                return true
            }
  
            // Log the failed attempt.
            this.winstonService.log(
                WinstonLog.CdnSynchronizerCourseSyncFailedAttempt,
                {
                    id,
                    attempt,
                    maxRetries,
                },
            )
  
            if (attempt < maxRetries) {
                // Wait for the retry delay.
                await sleep(retryDelayMs)
            }
        }
  
        // Log that the course was not synced successfully because the maximum number of retries was reached.
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCourseSyncFailedMaxRetriesReached,
            {
                id,
                maxRetries,
            },
        )

        // Return false because the course was not synced successfully.
        return false
    }
  
    /**
     * Sync one course to S3 and update the database.
     * @param id - The ID of the course to sync.
     * @returns The CDN URL of the course.
     */
    async syncOne(id: string): Promise<string | null> {
        try {
            // Get the course from the database.
            const course = await this.entityManager.findOne(
                CourseEntity,
                {
                    where: {
                        id 
                    },
                    relations: {
                        metadata: true,
                        prerequisites: true,
                        qnas: true,
                        modules: {
                            contents: true,
                            previewContents: true,
                            lessonVideos: {
                                translations: true,
                            },
                            submissions: true,
                        },
                    },
                }
            )
            // If the course is not found, return null.
            if (!course) return null
            // Serialize the course to JSON.
            const courseJson = this.superJson.stringify(course.toPlain())
            // Create the S3 object name.
            const s3ObjectName = `courses-${id}.json`
            // Build the CDN URL.
            const cdnUrl = this.s3BuildService.buildPublicObjectUrl(s3ObjectName)
            // Take the content if found.
            const content = await this.s3ReadService.json<CourseEntity>(s3ObjectName)
            // If the content is not found, return null.
            if (content) {
                // If both contents are the same, return the CDN URL.
                if (_.isEqual(
                    content, 
                    course.toPlain()
                )) {
                    return cdnUrl
                }
            }
            // Upload the course JSON to S3.
            await this.s3UploadService.json(
                {
                    name: s3ObjectName,
                    json: courseJson,
                    acl: "public-read",
                },
            )
            // Update the course in the database with the CDN URL.
            await this.entityManager.update(
                CourseEntity,
                {
                    id 
                },
                {
                    cdnUrl 
                },
            )
            // Return the CDN URL.
            return cdnUrl
        } catch (error) {
            // Log the error.
            this.winstonService.log(
                WinstonLog.CdnSynchronizerCourseSyncFailed,
                {
                    id,
                    error: error.message,
                },
            )
            // Return null because the course was not synced successfully.
            return null
        }
    }
}