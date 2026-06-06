import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    CourseEntity,
    ModuleEntity,
    ContentEntity,
    ChallengeEntity,
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
} from "./builder"
import {
    CdnReconcileService,
} from "./cdn-reconcile.service"
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
        private readonly retryService: RetryService,
        private readonly cdnReconcileService: CdnReconcileService,
    ) { }

    /** Entity kinds supported by the CDN synchronizer. */
    private readonly entityKinds: Array<SyncCdnEntityKind> = [
        CourseEntity.name,
        ChallengeEntity.name,
        ContentEntity.name,
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
                                displayId: course.displayId ?? "",
                                relativeDisplayIds: [],
                            }
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
                                displayId: challenge.displayId ?? "",
                                relativeDisplayIds: [],
                            }
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
                                displayId: content.displayId ?? "",
                                relativeDisplayIds: [],
                            }
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
                                displayId: module.displayId,
                                relativeDisplayIds: [],
                            }
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
            }
        }
        /**
         * Reconcile: diff the uploaded keys against the live database and prune
         * orphans (only deletes when SYNC_PRUNE_ORPHANS=true; otherwise logs the diff).
         * Runs after the upload loop so every desired key is already present.
         */
        await this.cdnReconcileService.reconcileAll()
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
