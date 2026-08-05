import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    MoreThan,
    type EntityManager,
} from "typeorm"
import {
    CdnChallengeBuildService,
} from "./builder/challenge.service"
import {
    CdnContentBuildService,
} from "./builder/content.service"
import {
    CdnCourseBuildService,
} from "./builder/course.service"
import {
    CdnMilestoneTaskBuildService,
} from "./builder/milestone-task.service"
import {
    CdnModuleBuildService,
} from "./builder/module.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    SyncCdnEntityKind,
} from "@modules/integrations/bullmq/types/payloads/sync-cdn"
import {
    S3BucketService,
} from "@modules/integrations/s3/s3-bucket.service"
import type {
    SynchronizerSyncScope,
} from "../../types/context"
import {
    shouldSyncChallengeEntity,
    shouldSyncContentEntity,
    shouldSyncCourseEntity,
    shouldSyncMilestoneTaskEntity,
    shouldSyncModuleEntity,
} from "../../utils/entity-sync-filter"
import {
    buildChallengeSyncSuccessLog,
    buildContentSyncSuccessLog,
    buildCourseSyncSuccessLog,
    buildMilestoneTaskSyncSuccessLog,
    buildModuleSyncSuccessLog,
} from "../../utils/sync-success-log"

@Injectable()
/**
 * CDN synchronizer -- iterates all entities and calls CDN builder for each.
 */
export class CdnSynchronizerService {

    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cdnCourseBuildService: CdnCourseBuildService,
        private readonly cdnModuleBuildService: CdnModuleBuildService,
        private readonly cdnContentBuildService: CdnContentBuildService,
        private readonly cdnChallengeBuildService: CdnChallengeBuildService,
        private readonly cdnMilestoneTaskBuildService: CdnMilestoneTaskBuildService,
        private readonly s3BucketService: S3BucketService,
    ) { }

    /** Entity kinds supported by the CDN synchronizer. */
    private readonly entityKinds: Array<SyncCdnEntityKind> = [
        CourseEntity.name,
        ChallengeEntity.name,
        ContentEntity.name,
        ModuleEntity.name,
        MilestoneTaskEntity.name,
    ]

    /**
     * Sync all entities to CDN sequentially.
     */
    async sync(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        /**
         * Start the CDN synchronization.
         */
        const start = this.dayjsService.now()
        /**
         * Synchronize the entities.
         */
        for (const entityKind of this.entityKinds) {
            let resumeEntityId: string | null = null
            switch (entityKind) {
            case CourseEntity.name: {
                while (true) {
                    const course = await this.entityManager.findOne(
                        CourseEntity,
                        {
                            where: {
                                ...(
                                    resumeEntityId ? {
                                        id: MoreThan(resumeEntityId)
                                    } : {
                                    }
                                ),
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!course) {
                        break
                    }
                    if (!shouldSyncCourseEntity(scope,
                        course)) {
                        resumeEntityId = course.id
                        continue
                    }
                    try {
                        await this.cdnCourseBuildService.materializeAndUpload(
                            course.id,
                        )
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            buildCourseSyncSuccessLog(course),
                        )
                    } catch (error) {
                        const errorMessage = error instanceof Error
                            ? error.message
                            : String(error)
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: course.id,
                                errorName: error instanceof Error
                                    ? error.name
                                    : undefined,
                                errorMessage,
                                errorStack: error instanceof Error
                                    ? error.stack
                                    : undefined,
                            }
                        )
                    }
                    resumeEntityId = course.id
                }
                break
            }
            case ChallengeEntity.name: {
                while (true) {
                    const challenge = await this.entityManager.findOne(
                        ChallengeEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId)
                                } : {
                                }),
                            },
                            relations: {
                                content: {
                                    module: {
                                        course: true,
                                    },
                                },
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!challenge) {
                        break
                    }
                    if (!shouldSyncChallengeEntity(scope,
                        challenge)) {
                        resumeEntityId = challenge.id
                        continue
                    }
                    try {
                        await this.cdnChallengeBuildService.materializeAndUpload(
                            challenge.id,
                        )
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            buildChallengeSyncSuccessLog(challenge),
                        )
                    } catch (error) {
                        const errorMessage = error instanceof Error
                            ? error.message
                            : String(error)
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: challenge.id,
                                errorName: error instanceof Error
                                    ? error.name
                                    : undefined,
                                errorMessage,
                                errorStack: error instanceof Error
                                    ? error.stack
                                    : undefined,
                            }
                        )
                    }
                    resumeEntityId = challenge.id
                }
                break
            }
            case ContentEntity.name: {
                 
                while (true) {
                    const content = await this.entityManager.findOne(
                        ContentEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId)
                                } : {
                                }),
                            },
                            relations: {
                                module: {
                                    course: true,
                                },
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!content) {
                        break
                    }
                    if (!shouldSyncContentEntity(scope,
                        content)) {
                        resumeEntityId = content.id
                        continue
                    }
                    try {
                        await this.cdnContentBuildService.materializeAndUpload(
                            content.id,
                        )
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            buildContentSyncSuccessLog(content),
                        )
                    } catch (error) {
                        const errorMessage = error instanceof Error
                            ? error.message
                            : String(error)
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: content.id,
                                errorName: error instanceof Error
                                    ? error.name
                                    : undefined,
                                errorMessage,
                                errorStack: error instanceof Error
                                    ? error.stack
                                    : undefined,
                            }
                        )
                    }
                    resumeEntityId = content.id
                }
                break
            }
            
            case ModuleEntity.name: {
                while (true) {
                    const module = await this.entityManager.findOne(
                        ModuleEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId)
                                } : {
                                }),
                            },
                            relations: {
                                course: true,
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!module) {
                        break
                    }
                    if (!shouldSyncModuleEntity(scope,
                        module)) {
                        resumeEntityId = module.id
                        continue
                    }
                    try {
                        await this.cdnModuleBuildService.materializeAndUpload(
                            module.id,
                        )
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            buildModuleSyncSuccessLog(module),
                        )
                    } catch (error) {
                        const errorMessage = error instanceof Error
                            ? error.message
                            : String(error)
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: module.id,
                                errorName: error instanceof Error
                                    ? error.name
                                    : undefined,
                                errorMessage,
                                errorStack: error instanceof Error
                                    ? error.stack
                                    : undefined,
                            }
                        )
                    }
                    resumeEntityId = module.id
                }
                break
            }
            case MilestoneTaskEntity.name: {
                while (true) {
                    const milestoneTask = await this.entityManager.findOne(
                        MilestoneTaskEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId)
                                } : {
                                }),
                            },
                            relations: {
                                milestone: {
                                    course: true,
                                },
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!milestoneTask) {
                        break
                    }
                    if (!shouldSyncMilestoneTaskEntity(scope,
                        milestoneTask)) {
                        resumeEntityId = milestoneTask.id
                        continue
                    }
                    try {
                        await this.cdnMilestoneTaskBuildService.materializeAndUpload(
                            milestoneTask.id,
                        )
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            buildMilestoneTaskSyncSuccessLog(milestoneTask),
                        )
                    } catch (error) {
                        const errorMessage = error instanceof Error
                            ? error.message
                            : String(error)
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: milestoneTask.id,
                                errorName: error instanceof Error
                                    ? error.name
                                    : undefined,
                                errorMessage,
                                errorStack: error instanceof Error
                                    ? error.stack
                                    : undefined,
                            }
                        )
                    }
                    resumeEntityId = milestoneTask.id
                }
                break
            }
            }
        }
        /**
         * End the CDN synchronization.
         */
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCdnSyncDone,
            {
                doneAt: this.dayjsService.now(),
                durationMs: this.dayjsService.now().diff(
                    start
                ),
            }
        )
    }
}
