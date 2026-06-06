import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    CourseEntity,
    ModuleEntity,
    ContentEntity,
    ChallengeEntity,} from "@modules/databases"
import {
    MoreThan,
    type EntityManager,
} from "typeorm"
import {
    ElasticsearchCourseBuildService,
    ElasticsearchModuleBuildService,
    ElasticsearchContentBuildService,
    ElasticsearchChallengeBuildService,
} from "./builder"
import {
    ElasticsearchReconcileService,
} from "./elasticsearch-reconcile.service"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
    RetryService,
} from "@modules/mixin"
import {
    SyncElasticsearchEntityKind
} from "@modules/bullmq"

/**
 * Elasticsearch synchronizer — iterates all entities and calls ES builder for each.
 */
@Injectable()
export class ElasticsearchSynchronizerService {

    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly esCourseBuildService: ElasticsearchCourseBuildService,
        private readonly esModuleBuildService: ElasticsearchModuleBuildService,
        private readonly esContentBuildService: ElasticsearchContentBuildService,
        private readonly esChallengeBuildService: ElasticsearchChallengeBuildService,
        private readonly retryService: RetryService,
        private readonly elasticsearchReconcileService: ElasticsearchReconcileService,
    ) { }

    /** Entity kinds supported by the Elasticsearch synchronizer. */
    private readonly entityKinds: Array<SyncElasticsearchEntityKind> = [
        CourseEntity.name,
        ChallengeEntity.name,
        ContentEntity.name,
        ModuleEntity.name,
    ]

    /**
     * Sync all entities to Elasticsearch sequentially.
     */
    async sync(): Promise<void> {
        /**
         * Start the Elasticsearch synchronization.
         */
        const start = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.EsSynchronizerSyncStarted,
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
                            action: () => this.esCourseBuildService.buildIndexById(
                                course.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: course.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
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
                            action: () => this.esChallengeBuildService.buildIndexById(
                                challenge.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: challenge.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
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
                            action: () => this.esContentBuildService.buildIndexById(
                                content.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: content.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
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
                            action: () => this.esModuleBuildService.buildIndexById(
                                module.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: module.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
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
         * Reconcile: diff the indexed docs against the live database and prune
         * orphans (only deletes when SYNC_PRUNE_ORPHANS=true; otherwise logs the diff).
         * Runs after the index loop so every desired doc is already present.
         */
        await this.elasticsearchReconcileService.reconcileAll()
        /**
         * End the Elasticsearch synchronization.
         */
        this.winstonService.log(
            WinstonLog.EsSynchronizerSyncDone,
            {
                doneAt: this.dayjsService.now(),
                durationMs: this.dayjsService.now().diff(
                    start
                ),
            }
        )
    }
}
