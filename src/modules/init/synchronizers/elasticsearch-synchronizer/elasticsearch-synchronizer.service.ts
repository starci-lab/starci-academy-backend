import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
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
    FoundationCategoryEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    EntityManager,
} from "typeorm"
import {
    ElasticsearchChallengeBuildService,
} from "./builder/challenge.service"
import {
    ElasticsearchCodingProblemBuildService,
} from "./builder/coding-problem.service"
import {
    ElasticsearchConsultantBuildService,
} from "./builder/consultant.service"
import {
    ElasticsearchContentBuildService,
} from "./builder/content.service"
import {
    ElasticsearchCourseBuildService,
} from "./builder/course.service"
import {
    ElasticsearchFlashcardDeckBuildService,
} from "./builder/flashcard-deck.service"
import {
    ElasticsearchFoundationCategoryBuildService,
} from "./builder/foundation-category.service"
import {
    ElasticsearchFoundationBuildService,
} from "./builder/foundation.service"
import {
    ElasticsearchHeadhunterCompanyBuildService,
} from "./builder/headhunting-company.service"
import {
    ElasticsearchMilestoneTaskBuildService,
} from "./builder/milestone-task.service"
import {
    ElasticsearchMilestoneBuildService,
} from "./builder/milestone.service"
import {
    ElasticsearchModuleBuildService,
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
    SyncElasticsearchEntityKind,
} from "@modules/integrations/bullmq/types/payloads/sync-elasticsearch"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
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
    fetchNextCodingProblem,
    fetchNextConsultant,
    fetchNextContent,
    fetchNextCourse,
    fetchNextFlashcardDeck,
    fetchNextFoundation,
    fetchNextFoundationCategory,
    fetchNextHeadhuntingCompany,
    fetchNextMilestone,
    fetchNextMilestoneTask,
    fetchNextModule,
} from "../../utils/entity-cursor-fetch"
import {
    runPaginatedEntitySync,
} from "../../utils/paginated-entity-sync"
import type {
    EsSynchronizerSyncedSuccessfullyMessage,
} from "@modules/platform/winston/types/messages/elasticsearch-synchronizer"

@Injectable()
/**
 * Elasticsearch synchronizer -- iterates all entities and calls ES builder for each.
 */
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
        private readonly esMilestoneBuildService: ElasticsearchMilestoneBuildService,
        private readonly esMilestoneTaskBuildService: ElasticsearchMilestoneTaskBuildService,
        private readonly esFoundationBuildService: ElasticsearchFoundationBuildService,
        private readonly esFoundationCategoryBuildService: ElasticsearchFoundationCategoryBuildService,
        private readonly esHeadhunterCompanyBuildService: ElasticsearchHeadhunterCompanyBuildService,
        private readonly esHeadhunterBuildService: ElasticsearchConsultantBuildService,
        private readonly esFlashcardDeckBuildService: ElasticsearchFlashcardDeckBuildService,
        private readonly esCodingProblemBuildService: ElasticsearchCodingProblemBuildService,
        private readonly elasticsearchService: ElasticsearchService,
    ) { }

    /** Entity kinds supported by the Elasticsearch synchronizer. */
    private readonly entityKinds: Array<SyncElasticsearchEntityKind> = [
        CourseEntity.name,
        ChallengeEntity.name,
        ContentEntity.name,
        ModuleEntity.name,
        MilestoneEntity.name,
        MilestoneTaskEntity.name,
        FoundationCategoryEntity.name,
        FoundationEntity.name,
        HeadhuntingCompanyEntity.name,
        ConsultantEntity.name,
        FlashcardDeckEntity.name,
        CodingProblemEntity.name,
    ]

    private readonly foundationEntityKinds = [
        FoundationCategoryEntity.name,
        FoundationEntity.name,
    ]

    private readonly headhuntingEntityKinds = [
        HeadhuntingCompanyEntity.name,
        ConsultantEntity.name,
    ]

    private readonly flashcardEntityKinds = [
        FlashcardDeckEntity.name,
    ]

    private readonly codingProblemEntityKinds = [
        CodingProblemEntity.name,
    ]

    /**
     * Sync all entities to Elasticsearch sequentially.
     */
    async sync(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        /**
         * Start the Elasticsearch synchronization.
         */
        const start = this.dayjsService.now()
        /**
         * Clear then re-index per entity kind (only kinds allowed by scope).
         */
        for (const entityKind of this.entityKinds) {
            if (!shouldSynchronizerSyncEntityKind(
                scope,
                entityKind,
                this.foundationEntityKinds,
                this.headhuntingEntityKinds,
                this.flashcardEntityKinds,
                this.codingProblemEntityKinds,
            )) {
                continue
            }
            await this.ensureIndexForAllLocales(entityKind)
            await this.syncEntityKind(scope,
                entityKind)
        }

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

    /**
     * SCOPED sync: do NOT delete the whole index (that would wipe out-of-scope records,
     * e.g. other courses/modules not selected in the env filter). Instead just ensure the
     * index exists with the explicit mapping patch (additive on an existing index). The
     * re-index loop that follows then OVERWRITES only the in-scope documents by id, leaving
     * every out-of-scope document untouched.
     */
    private async ensureIndexForAllLocales(
        entityKind: SyncElasticsearchEntityKind,
    ): Promise<void> {
        for (const locale of Object.values(Locale)) {
            await this.elasticsearchService.ensureIndexForEntity(
                {
                    entity: entityKind,
                    locale,
                },
            )
        }
    }

    /** Dispatch to the paginated sync loop for one entity kind. */
    private async syncEntityKind(
        scope: SynchronizerSyncScope,
        entityKind: SyncElasticsearchEntityKind,
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
        case FoundationCategoryEntity.name:
            return this.syncFoundationCategoryEntities()
        case FoundationEntity.name:
            return this.syncFoundationEntities()
        case HeadhuntingCompanyEntity.name:
            return this.syncHeadhuntingCompanyEntities()
        case ConsultantEntity.name:
            return this.syncConsultantEntities()
        case FlashcardDeckEntity.name:
            return this.syncFlashcardDeckEntities()
        case CodingProblemEntity.name:
            return this.syncCodingProblemEntities()
        default:
            return
        }
    }

    /** Log one entity's successful ES sync. */
    private logEntitySynced(
        payload: EsSynchronizerSyncedSuccessfullyMessage,
    ): void {
        this.winstonService.log(
            WinstonLog.EsSynchronizerSyncedSuccessfully,
            payload,
        )
    }

    /** Log one entity's failed ES sync (never throws -- the page loop continues). */
    private logEntitySyncFailed(
        entityKind: SyncElasticsearchEntityKind,
        entityId: string,
        error,
    ): void {
        this.winstonService.log(
            WinstonLog.EsSynchronizerEntitySyncFailed,
            {
                entityKind,
                entityId,
                error: error.message,
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
            build: (course) => this.esCourseBuildService.buildIndexById(
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
            build: (challenge) => this.esChallengeBuildService.buildIndexById(
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
            build: (content) => this.esContentBuildService.buildIndexById(
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
            build: (module) => this.esModuleBuildService.buildIndexById(
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
            build: (milestone) => this.esMilestoneBuildService.buildIndexById(
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
            build: (milestoneTask) => this.esMilestoneTaskBuildService.buildIndexById(
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

    private async syncFoundationCategoryEntities(): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextFoundationCategory(this.entityManager),
            build: (category) => this.esFoundationCategoryBuildService.buildIndexById(
                category.id,
            ),
            onSynced: (category) => this.logEntitySynced(
                {
                    entityKind: FoundationCategoryEntity.name,
                    entityId: category.id,
                }),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                FoundationCategoryEntity.name,
                entityId,
                error),
        })
    }

    private async syncFoundationEntities(): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextFoundation(this.entityManager),
            build: (foundation) => this.esFoundationBuildService.buildIndexById(
                foundation.id,
            ),
            onSynced: (foundation) => this.logEntitySynced(
                {
                    entityKind: FoundationEntity.name,
                    entityId: foundation.id,
                }),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                FoundationEntity.name,
                entityId,
                error),
        })
    }

    private async syncHeadhuntingCompanyEntities(): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextHeadhuntingCompany(this.entityManager),
            build: (company) => this.esHeadhunterCompanyBuildService.buildIndexById(
                company.id,
            ),
            onSynced: (company) => this.logEntitySynced(
                {
                    entityKind: HeadhuntingCompanyEntity.name,
                    entityId: company.id,
                }),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                HeadhuntingCompanyEntity.name,
                entityId,
                error),
        })
    }

    private async syncConsultantEntities(): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextConsultant(this.entityManager),
            build: (consultant) => this.esHeadhunterBuildService.buildIndexById(
                consultant.id,
            ),
            onSynced: (consultant) => this.logEntitySynced(
                {
                    entityKind: ConsultantEntity.name,
                    entityId: consultant.id,
                }),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                ConsultantEntity.name,
                entityId,
                error),
        })
    }

    private async syncFlashcardDeckEntities(): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextFlashcardDeck(this.entityManager),
            build: (deck) => this.esFlashcardDeckBuildService.buildIndexById(
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

    private async syncCodingProblemEntities(): Promise<void> {
        await runPaginatedEntitySync({
            fetchNext: fetchNextCodingProblem(this.entityManager),
            build: (problem) => this.esCodingProblemBuildService.buildIndexById(
                problem.id,
            ),
            onSynced: (problem) => this.logEntitySynced(
                {
                    entityKind: CodingProblemEntity.name,
                    entityId: problem.id,
                }),
            onFailed: (entityId, error) => this.logEntitySyncFailed(
                CodingProblemEntity.name,
                entityId,
                error),
        })
    }
}
