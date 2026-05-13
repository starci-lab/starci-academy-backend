import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    CourseEntity,
    ModuleEntity,
    ContentEntity,
    ChallengeEntity,
    LessonVideoEntity,
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
    CdnLessonVideoBuildService,
} from "./builder"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
    RetryService,
} from "@modules/mixin"
import {
    SyncCdnEntityKind
} from "@modules/bullmq"

/**
 * CDN synchronizer — iterates all entities and calls CDN builder for each.
 */
@Injectable()
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
        private readonly cdnLessonVideoBuildService: CdnLessonVideoBuildService,
        private readonly retryService: RetryService,
    ) { }

    /** Entity kinds supported by the CDN synchronizer. */
    private readonly entityKinds: Array<SyncCdnEntityKind> = [
        CourseEntity.name,
        ChallengeEntity.name,
        ContentEntity.name,
        LessonVideoEntity.name,
        ModuleEntity.name,
    ]

    /**
     * Sync all entities to CDN sequentially.
     */
    async sync(): Promise<void> {
        /**
         * Start the CDN synchronization.
         */
        const start = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCdnSyncStarted,
            {
                startedAt: start,
            }
        )
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
                    try {
                        await this.retryService.retry({
                            action: () => this.cdnCourseBuildService.materializeAndUpload(
                                course.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: course.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: course.id,
                                error: error.message,
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
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!challenge) {
                        break
                    }
                    try {
                        await this.retryService.retry({
                            action: () => this.cdnChallengeBuildService.materializeAndUpload(
                                challenge.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: challenge.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: challenge.id,
                                error: error.message,
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
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!content) {
                        break
                    }
                    try {
                        await this.retryService.retry({
                            action: () => this.cdnContentBuildService.materializeAndUpload(
                                content.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: content.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: content.id,
                                error: error.message,
                            }
                        )
                    }
                    resumeEntityId = content.id
                }
                break
            }
            case LessonVideoEntity.name: {
                 
                while (true) {
                    const lessonVideo = await this.entityManager.findOne(
                        LessonVideoEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId)
                                } : {
                                }),
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!lessonVideo) {
                        break
                    }
                    try {
                        await this.retryService.retry({
                            action: () => this.cdnLessonVideoBuildService.materializeAndUpload(
                                lessonVideo.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: lessonVideo.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: lessonVideo.id,
                                error: error.message,
                            }
                        )
                    }
                    resumeEntityId = lessonVideo.id
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
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!module) {
                        break
                    }
                    try {
                        await this.retryService.retry({
                            action: () => this.cdnModuleBuildService.materializeAndUpload(
                                module.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: module.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: module.id,
                                error: error.message,
                            }
                        )
                    }
                    resumeEntityId = module.id
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
