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
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    EntityManager,
} from "typeorm"
import {
    IndexerChallengeBuildService,
} from "./builder/challenge.service"
import {
    IndexerContentBuildService,
} from "./builder/content.service"
import {
    IndexerCourseBuildService,
} from "./builder/course.service"
import {
    IndexerFlashcardDeckBuildService,
} from "./builder/flashcard-deck.service"
import {
    IndexerMilestoneTaskBuildService,
} from "./builder/milestone-task.service"
import {
    IndexerMilestoneBuildService,
} from "./builder/milestone.service"
import {
    IndexerModuleBuildService,
} from "./builder/module.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    IndexerSynchronizerSyncedSuccessfullyMessage,
} from "@modules/platform/winston/types/messages/indexer-synchronizer"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    SyncIndexerEntityKind,
} from "@modules/integrations/bullmq/types/payloads/sync-indexer"
import type {
    SynchronizerSyncScope,
} from "../../types/context"
import {
    shouldSyncChallengeEntity,
    shouldSyncContentEntity,
    shouldSyncCourseEntity,
    shouldSyncMilestoneEntity,
    shouldSyncMilestoneTaskEntity,
    shouldSyncModuleEntity,
    shouldSynchronizerSyncEntityKind,
} from "../../utils/entity-sync-filter"
import {
    buildChallengeSyncSuccessLog,
    buildContentSyncSuccessLog,
    buildCourseSyncSuccessLog,
    buildModuleSyncSuccessLog,
} from "../../utils/sync-success-log"
import {
    fetchNextChallenge,
    fetchNextContent,
    fetchNextCourse,
    fetchNextFlashcardDeck,
    fetchNextMilestone,
    fetchNextMilestoneTask,
    fetchNextModule,
} from "../../utils/entity-cursor-fetch"
import {
    runPaginatedEntitySync,
} from "../../utils/paginated-entity-sync"

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
            await this.syncEntityKind(scope,
                entityKind)
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

    /** Dispatch to the paginated sync loop for one entity kind. */
    private async syncEntityKind(
        scope: SynchronizerSyncScope,
        entityKind: SyncIndexerEntityKind,
    ): Promise<void> {
        switch (entityKind) {
        case CourseEntity.name:
            return this.syncCourseEntities(scope)
        case ChallengeEntity.name:
            return this.syncChallengeEntities(scope)
        case ContentEntity.name:
            return this.syncContentEntities(scope)
        case ModuleEntity.name:
            return this.syncModuleEntities(scope)
        case MilestoneEntity.name:
            return this.syncMilestoneEntities(scope)
        case MilestoneTaskEntity.name:
            return this.syncMilestoneTaskEntities(scope)
        case FlashcardDeckEntity.name:
            return this.syncFlashcardDeckEntities()
        default:
            return
        }
    }

    /** Log one entity's successful Indexer sync. */
    private logEntitySynced(
        payload: IndexerSynchronizerSyncedSuccessfullyMessage,
    ): void {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerSyncedSuccessfully,
            payload,
        )
    }

    /** Log one entity's failed Indexer sync (never throws -- the page loop continues). */
    private logEntitySyncFailed(
        entityKind: SyncIndexerEntityKind,
        entityId: string,
        error: unknown,
    ): void {
        this.winstonService.log(
            WinstonLog.IndexerSynchronizerEntitySyncFailed,
            {
                entityKind,
                entityId,
                error: error instanceof Error ? error.message : String(error),
            }
        )
    }

    private async syncCourseEntities(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextCourse(this.entityManager),
            shouldSync: (course) => shouldSyncCourseEntity(scope,
                course),
            build: (course) => this.indexerCourseBuildService.buildIndexerById(
                course.id,
            ),
            onSynced: (course) => this.logEntitySynced(
                buildCourseSyncSuccessLog(course)),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                CourseEntity.name,
                entityId,
                error),
        })
    }

    private async syncChallengeEntities(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextChallenge(this.entityManager),
            shouldSync: (challenge) => shouldSyncChallengeEntity(scope,
                challenge),
            build: (challenge) => this.indexerChallengeBuildService.buildIndexerById(
                challenge.id,
            ),
            onSynced: (challenge) => this.logEntitySynced(
                buildChallengeSyncSuccessLog(challenge)),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                ChallengeEntity.name,
                entityId,
                error),
        })
    }

    private async syncContentEntities(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextContent(this.entityManager),
            shouldSync: (content) => shouldSyncContentEntity(scope,
                content),
            build: (content) => this.indexerContentBuildService.buildIndexerById(
                content.id,
            ),
            onSynced: (content) => this.logEntitySynced(
                buildContentSyncSuccessLog(content)),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                ContentEntity.name,
                entityId,
                error),
        })
    }

    private async syncModuleEntities(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextModule(this.entityManager),
            shouldSync: (module) => shouldSyncModuleEntity(scope,
                module),
            build: (module) => this.indexerModuleBuildService.buildIndexerById(
                module.id,
            ),
            onSynced: (module) => this.logEntitySynced(
                buildModuleSyncSuccessLog(module)),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                ModuleEntity.name,
                entityId,
                error),
        })
    }

    private async syncMilestoneEntities(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextMilestone(this.entityManager),
            shouldSync: (milestone) => shouldSyncMilestoneEntity(scope,
                milestone),
            build: (milestone) => this.indexerMilestoneBuildService.buildIndexerById(
                milestone.id,
            ),
            onSynced: (milestone) => this.logEntitySynced(
                {
                    entityKind: MilestoneEntity.name,
                    entityId: milestone.id,
                }),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                MilestoneEntity.name,
                entityId,
                error),
        })
    }

    private async syncMilestoneTaskEntities(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextMilestoneTask(this.entityManager),
            shouldSync: (milestoneTask) => shouldSyncMilestoneTaskEntity(scope,
                milestoneTask),
            build: (milestoneTask) => this.indexerMilestoneTaskBuildService.buildIndexerById(
                milestoneTask.id,
            ),
            onSynced: (milestoneTask) => this.logEntitySynced(
                {
                    entityKind: MilestoneTaskEntity.name,
                    entityId: milestoneTask.id,
                }),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                MilestoneTaskEntity.name,
                entityId,
                error),
        })
    }

    private async syncFlashcardDeckEntities(): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextFlashcardDeck(this.entityManager),
            build: (deck) => this.indexerFlashcardDeckBuildService.buildIndexerById(
                deck.id,
            ),
            onSynced: (deck) => this.logEntitySynced(
                {
                    entityKind: FlashcardDeckEntity.name,
                    entityId: deck.id,
                }),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                FlashcardDeckEntity.name,
                entityId,
                error),
        })
    }
}
