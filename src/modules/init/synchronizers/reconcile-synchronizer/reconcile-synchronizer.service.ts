import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
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
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3DeleteService,
} from "@modules/integrations/s3/s3-delete.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    exceedsPruneRatio,
    partitionOrphanCdnKeys,
} from "./utils/reconcile"
import type {
    CdnTarget,
    ReconcileIdsResult,
    LiveColumnsRow,
} from "./types/reconcile"

/**
 * Every content entity type with an Elasticsearch index -- reconciled per locale.
 * The class `.name` is the key {@link ElasticsearchService.pruneOrphans} resolves
 * its `<base>-<locale>` index from, and the seeded doc `_id` is the entity id.
 */
const ELASTICSEARCH_TARGETS = [
    CourseEntity,
    ChallengeEntity,
    ContentEntity,
    ModuleEntity,
    MilestoneEntity,
    MilestoneTaskEntity,
    FoundationEntity,
    FoundationCategoryEntity,
    HeadhuntingCompanyEntity,
    ConsultantEntity,
    FlashcardDeckEntity,
    CodingProblemEntity,
]

/**
 * Content entity types uploaded to the CDN -- objects are keyed by both id and
 * displayId (with/without a locale suffix), so the live set unions both.
 */
const CDN_TARGETS: Array<CdnTarget> = [
    {
        entity: CourseEntity,
        prefix: "courses/",
    },
    {
        entity: ModuleEntity,
        prefix: "modules/",
    },
    {
        entity: ContentEntity,
        prefix: "contents/",
    },
    {
        entity: ChallengeEntity,
        prefix: "challenges/",
    },
    {
        entity: MilestoneTaskEntity,
        prefix: "milestone-tasks/",
    },
]

@Injectable()
/**
 * Deletes Elasticsearch docs + CDN objects whose entity no longer exists in
 * PostgreSQL -- the ghosts left behind when content is removed or renumbered.
 *
 * Runs after the sync phase (PostgreSQL is then the authoritative, complete set,
 * even after a partial diff seed). For every content entity type it pulls the live
 * id/displayId set from the DB and prunes anything in ES/CDN that isn't in it. A
 * per-target ratio guard skips (with a loud warn) when more than
 * `pruneMaxRatio` of a type would be deleted -- so an empty DB (seed hiccup) can
 * never wipe the search index or CDN.
 */
export class ReconcileSynchronizerService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearchService: ElasticsearchService,
        private readonly s3ReadService: S3ReadService,
        private readonly s3DeleteService: S3DeleteService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Reconcile every content entity type's ES index + CDN prefix against the DB.
     *
     * No-op when `SYNCHRONIZER_PRUNE_ORPHANS` is off.
     */
    async reconcile(): Promise<void> {
        const {
            pruneOrphans,
            pruneMaxRatio,
        } = envConfig().services.synchronizer
        if (!pruneOrphans) {
            return
        }
        let esDeleted = 0
        let cdnDeleted = 0

        // Elasticsearch: prune per entity type, per locale
        for (const target of ELASTICSEARCH_TARGETS) {
            const liveIds = await this.liveColumns(target,
                false)
            for (const locale of [
                Locale.Vi,
                Locale.En,
            ]) {
                esDeleted += await this.pruneElasticsearch(target.name,
                    locale,
                    liveIds.ids,
                    pruneMaxRatio)
            }
        }

        // CDN: prune per entity type (id + displayId keyed objects)
        for (const {
            entity,
            prefix,
        } of CDN_TARGETS) {
            const live = await this.liveColumns(entity,
                true)
            const liveSet = new Set<string>([
                ...live.ids,
                ...live.displayIds,
            ])
            cdnDeleted += await this.pruneCdn(prefix,
                liveSet,
                pruneMaxRatio)
        }

        this.winstonService.log(WinstonLog.ReconcileOrphansDone,
            {
                elasticsearchDeleted: esDeleted,
                cdnDeleted,
            })
    }

    /**
     * Loads the live id (and optionally displayId) values for an entity type.
     *
     * @param entity - The entity class to query
     * @param withDisplayId - Also select `displayId` (CDN-keyed types only)
     * @returns The live ids and displayIds
     */
    private async liveColumns(
        entity: Parameters<EntityManager["getRepository"]>[0],
        withDisplayId: boolean,
    ): Promise<ReconcileIdsResult> {
        const rows = await this.entityManager.getRepository(entity).find({
            select: withDisplayId
                ? {
                    id: true,
                    displayId: true,
                }
                : {
                    id: true,
                },
        }) as Array<LiveColumnsRow>
        const ids: Array<string> = []
        const displayIds: Array<string> = []
        for (const row of rows) {
            if (row.id) {
                ids.push(String(row.id))
            }
            if (withDisplayId && row.displayId) {
                displayIds.push(String(row.displayId))
            }
        }
        return {
            ids,
            displayIds,
        }
    }

    /**
     * Prunes one entity type's per-locale ES index against the live id set,
     * skipping (with a warn) when the delete ratio is unsafe.
     *
     * @returns The number of docs deleted
     */
    private async pruneElasticsearch(
        entity: string,
        locale: Locale,
        liveIds: Array<string>,
        maxRatio: number,
    ): Promise<number> {
        const total = await this.elasticsearchService.countDocs({
            entity,
            locale,
        })
        if (total === 0) {
            return 0
        }
        // estimate orphans as the surplus over the live set (conservative for the guard)
        const orphans = Math.max(0,
            total - liveIds.length)
        if (orphans === 0) {
            return 0
        }
        if (exceedsPruneRatio(orphans,
            total,
            maxRatio)) {
            this.winstonService.log(WinstonLog.ReconcileOrphansSkipped,
                {
                    sink: "elasticsearch",
                    target: `${entity}-${locale}`,
                    total,
                    orphans,
                    maxRatio,
                })
            return 0
        }
        return this.elasticsearchService.pruneOrphans({
            entity,
            locale,
            ids: liveIds,
        })
    }

    /**
     * Prunes one entity type's CDN prefix against the live id/displayId set,
     * skipping (with a warn) when the delete ratio is unsafe.
     *
     * @returns The number of objects deleted
     */
    private async pruneCdn(
        prefix: string,
        liveSet: Set<string>,
        maxRatio: number,
    ): Promise<number> {
        // sync uploads to MinIO only -> reconcile the same provider
        const keys = await this.s3ReadService.listAll({
            prefix,
            provider: S3Provider.Minio,
        })
        if (keys.length === 0) {
            return 0
        }
        const {
            orphanKeys,
            totalSegments,
            orphanSegments,
        } = partitionOrphanCdnKeys(keys,
            prefix,
            liveSet)
        if (orphanKeys.length === 0) {
            return 0
        }
        if (exceedsPruneRatio(orphanSegments,
            totalSegments,
            maxRatio)) {
            this.winstonService.log(WinstonLog.ReconcileOrphansSkipped,
                {
                    sink: "cdn",
                    target: prefix,
                    total: totalSegments,
                    orphans: orphanSegments,
                    maxRatio,
                })
            return 0
        }
        return this.s3DeleteService.deleteObjects({
            keys: orphanKeys,
            provider: S3Provider.Minio,
        })
    }
}
