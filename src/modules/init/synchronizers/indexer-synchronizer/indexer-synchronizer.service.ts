import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    CourseEntity,
    ModuleEntity,
    ContentEntity,
    ChallengeEntity,
    MilestoneEntity,
    MilestoneTaskEntity,
    FlashcardDeckEntity,
} from "@modules/databases"
import {
    MoreThan,
    type EntityManager,
} from "typeorm"
import {
    IndexerCourseBuildService,
    IndexerModuleBuildService,
    IndexerContentBuildService,
    IndexerChallengeBuildService,
    IndexerMilestoneBuildService,
    IndexerMilestoneTaskBuildService,
    IndexerFlashcardDeckBuildService,
} from "./builder"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
} from "@modules/mixin"
import {
    SyncIndexerEntityKind
} from "@modules/bullmq"
import type {
    SynchronizerSyncScope,
} from "../../types"
import {
    buildChallengeSyncSuccessLog,
    buildContentSyncSuccessLog,
    buildCourseSyncSuccessLog,
    buildModuleSyncSuccessLog,
    shouldSyncChallengeEntity,
    shouldSyncContentEntity,
    shouldSyncCourseEntity,
    shouldSyncMilestoneEntity,
    shouldSyncMilestoneTaskEntity,
    shouldSyncModuleEntity,
    shouldSynchronizerSyncEntityKind,
} from "../../utils"

@Injectable()
/**
 * Indexer synchronizer -- iterates all entities and calls Indexer builder for each.
 */
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
        private readonly indexerMilestoneBuildService: IndexerMilestoneBuildService,
        private readonly indexerMilestoneTaskBuildService: IndexerMilestoneTaskBuildService,
        private readonly indexerFlashcardDeckBuildService: IndexerFlashcardDeckBuildService,
    ) { }

    /** Entity kinds supported by the Indexer synchronizer. */
    private readonly entityKinds: Array<SyncIndexerEntityKind> = [
        CourseEntity.name,
        ChallengeEntity.name,
        ContentEntity.name,
        ModuleEntity.name,
        MilestoneEntity.name,
        MilestoneTaskEntity.name,
        FlashcardDeckEntity.name,
    ]

    /** Flashcard-deck index is gated behind the `flashcards` scope flag. */
    private readonly flashcardEntityKinds = [
        FlashcardDeckEntity.name,
    ]

    /**
     * Sync all entities to Indexer sequentially.
     */
    async sync(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        /**
         * Start the Indexer synchronization.
         */
        const start = this.dayjsService.now()
        /**
         * Synchronize the entities.
         */
        for (const entityKind of this.entityKinds) {
            // skip the standalone flashcard-deck index when its scope flag is off
            if (!shouldSynchronizerSyncEntityKind(
                scope,
                entityKind,
                [],
                [],
                this.flashcardEntityKinds,
                [],
            )) {
                continue
            }
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
                        await this.indexerCourseBuildService.buildIndexerById(
                            course.id,
                        )
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            buildCourseSyncSuccessLog(course),
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
                        await this.indexerChallengeBuildService.buildIndexerById(
                            challenge.id,
                        )
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            buildChallengeSyncSuccessLog(challenge),
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
                        await this.indexerContentBuildService.buildIndexerById(
                            content.id,
                        )
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            buildContentSyncSuccessLog(content),
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
                        await this.indexerModuleBuildService.buildIndexerById(
                            module.id,
                        )
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            buildModuleSyncSuccessLog(module),
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
            case MilestoneEntity.name: {

                while (true) {
                    const milestone = await this.entityManager.findOne(
                        MilestoneEntity,
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
                    if (!milestone) {
                        break
                    }
                    if (!shouldSyncMilestoneEntity(scope,
                        milestone)) {
                        resumeEntityId = milestone.id
                        continue
                    }
                    try {
                        await this.indexerMilestoneBuildService.buildIndexerById(
                            milestone.id,
                        )
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: milestone.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: milestone.id,
                                error: error.message,
                            }
                        )
                    }
                    resumeEntityId = milestone.id
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
                        await this.indexerMilestoneTaskBuildService.buildIndexerById(
                            milestoneTask.id,
                        )
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: milestoneTask.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: milestoneTask.id,
                                error: error.message,
                            }
                        )
                    }
                    resumeEntityId = milestoneTask.id
                }
                break
            }
            case FlashcardDeckEntity.name: {

                while (true) {
                    const deck = await this.entityManager.findOne(
                        FlashcardDeckEntity,
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
                    if (!deck) {
                        break
                    }
                    try {
                        await this.indexerFlashcardDeckBuildService.buildIndexerById(
                            deck.id,
                        )
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: deck.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.IndexerSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: deck.id,
                                error: error.message,
                            }
                        )
                    }
                    resumeEntityId = deck.id
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
