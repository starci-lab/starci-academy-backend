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
    IndexerCourseBuildService,
    IndexerModuleBuildService,
    IndexerContentBuildService,
    IndexerChallengeBuildService,
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
    SyncIndexerEntityKind
} from "@modules/bullmq"

/**
 * Indexer synchronizer — iterates all entities and calls Indexer builder for each.
 */
@Injectable()
export class IndexerSynchronizerService {

    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly indexerCourseBuildService: IndexerCourseBuildService,
        private readonly indexerModuleBuildService: IndexerModuleBuildService,
        private readonly indexerContentBuildService: IndexerContentBuildService,
        private readonly indexerChallengeBuildService: IndexerChallengeBuildService,
        private readonly retryService: RetryService,
    ) { }

    /** Entity kinds supported by the Indexer synchronizer. */
    private readonly entityKinds: Array<SyncIndexerEntityKind> = [
        CourseEntity.name,
        ChallengeEntity.name,
        ContentEntity.name,
        ModuleEntity.name,
    ]

    /**
     * Sync all entities to Indexer sequentially.
     */
    async sync(): Promise<void> {
        /**
         * Start the Indexer synchronization.
         */
        const start = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerSyncStarted,
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
                            action: () => this.indexerCourseBuildService.buildIndexerById(
                                course.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: course.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerEntitySyncFailed,
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
                            action: () => this.indexerChallengeBuildService.buildIndexerById(
                                challenge.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: challenge.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerEntitySyncFailed,
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
                            action: () => this.indexerContentBuildService.buildIndexerById(
                                content.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: content.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerEntitySyncFailed,
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
                            action: () => this.indexerModuleBuildService.buildIndexerById(
                                module.id,
                            ),
                        })
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: module.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerEntitySyncFailed,
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
         * End the Indexer synchronization.
         */
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerSyncDone,
            {
                doneAt: this.dayjsService.now(),
                durationMs: this.dayjsService.now().diff(
                    start
                ),
            }
        )
    }
}
