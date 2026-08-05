import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    CourseEntity,
    ModuleEntity,
    ContentEntity,
    ChallengeEntity,
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    MoreThan,
    type EntityManager,
} from "typeorm"
import {
    CdnCourseBuildService,
    CdnModuleBuildService,
    CdnContentBuildService,
    CdnChallengeBuildService,
    CdnMilestoneTaskBuildService,
} from "./builder"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
} from "@modules/mixin"
import {
    SyncCdnEntityKind
} from "@modules/bullmq"
import {
    S3BucketService
} from "@modules/s3"
import type {
    SynchronizerSyncScope,
} from "../../types"
import {
    buildChallengeSyncSuccessLog,
    buildContentSyncSuccessLog,
    buildCourseSyncSuccessLog,
    buildMilestoneTaskSyncSuccessLog,
    buildModuleSyncSuccessLog,
    shouldSyncChallengeEntity,
    shouldSyncContentEntity,
    shouldSyncCourseEntity,
    shouldSyncMilestoneTaskEntity,
    shouldSyncModuleEntity,
} from "../../utils"

@Injectable()
/**
 * CDN synchronizer — iterates all entities and calls CDN builder for each.
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
