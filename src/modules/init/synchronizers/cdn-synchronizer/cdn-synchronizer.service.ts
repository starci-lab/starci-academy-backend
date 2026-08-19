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
import type {
    EntityManager,
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
import {
    fetchNextChallenge,
    fetchNextContent,
    fetchNextCourse,
    fetchNextMilestoneTask,
    fetchNextModule,
} from "../../utils/entity-cursor-fetch"
import {
    runPaginatedEntitySync,
} from "../../utils/paginated-entity-sync"
import type {
    CdnSynchronizerSyncedSuccessfullyMessage,
} from "@modules/platform/winston/types/messages/cdn-synchronizer"

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
            await this.syncEntityKind(scope,
                entityKind)
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

    /** Dispatch to the paginated sync loop for one entity kind. */
    private async syncEntityKind(
        scope: SynchronizerSyncScope,
        entityKind: SyncCdnEntityKind,
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
        case MilestoneTaskEntity.name:
            return this.syncMilestoneTaskEntities(scope)
        default:
            return
        }
    }

    /** Log one entity's successful CDN sync. */
    private logEntitySynced(
        payload: CdnSynchronizerSyncedSuccessfullyMessage,
    ): void {
        this.winstonService.log(
            WinstonLog.CdnSynchronizerSyncedSuccessfully,
            payload,
        )
    }

    /** Log one entity's failed CDN sync (never throws -- the page loop continues). */
    private logEntitySyncFailed(
        entityKind: SyncCdnEntityKind,
        entityId: string,
        error: unknown,
    ): void {
        this.winstonService.log(
            WinstonLog.CdnSynchronizerEntitySyncFailed,
            {
                entityKind,
                entityId,
                errorName: error instanceof Error ? error.name : undefined,
                errorMessage: error instanceof Error ? error.message : String(error),
                errorStack: error instanceof Error ? error.stack : undefined,
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
            build: (course) => this.cdnCourseBuildService.materializeAndUpload(
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
            build: (challenge) => this.cdnChallengeBuildService.materializeAndUpload(
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
            build: (content) => this.cdnContentBuildService.materializeAndUpload(
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
            build: (module) => this.cdnModuleBuildService.materializeAndUpload(
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

    private async syncMilestoneTaskEntities(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextMilestoneTask(this.entityManager),
            shouldSync: (milestoneTask) => shouldSyncMilestoneTaskEntity(scope,
                milestoneTask),
            build: (milestoneTask) => this.cdnMilestoneTaskBuildService.materializeAndUpload(
                milestoneTask.id,
            ),
            onSynced: (milestoneTask) => this.logEntitySynced(
                buildMilestoneTaskSyncSuccessLog(milestoneTask)),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                MilestoneTaskEntity.name,
                entityId,
                error),
        })
    }
}
