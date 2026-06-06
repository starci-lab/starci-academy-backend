import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    CourseEntity,
    ChallengeEntity,
    ContentEntity,
    ModuleEntity,
    Locale,
} from "@modules/databases"
import {
    type EntityManager,
} from "typeorm"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    parseEnvBoolean,
    parseEnvFloat,
} from "@modules/env"
import type {
    EsReconcileTarget,
} from "./types"

/**
 * Elasticsearch reconcile — diffs the documents stored in each per-locale index
 * against the id set the database says should exist, logs the diff, and (when
 * enabled) deletes the orphaned documents.
 *
 * Runs after {@link ElasticsearchSynchronizerService} has indexed the live
 * entities, so every desired doc is guaranteed present before computing surplus.
 */
@Injectable()
export class ElasticsearchReconcileService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearchService: ElasticsearchService,
        private readonly winstonService: WinstonService,
    ) {}

    /** Entity targets reconciled — one base index per entity, suffixed per locale. */
    private readonly targets: Array<EsReconcileTarget> = [
        {
            entity: CourseEntity,
            entityName: CourseEntity.name,
        },
        {
            entity: ChallengeEntity,
            entityName: ChallengeEntity.name,
        },
        {
            entity: ContentEntity,
            entityName: ContentEntity.name,
        },
        {
            entity: ModuleEntity,
            entityName: ModuleEntity.name,
        },
    ]

    /**
     * Reconcile every entity index for every locale: log the orphan diff and,
     * when `SYNC_PRUNE_ORPHANS=true`, delete the orphaned documents.
     */
    async reconcileAll(): Promise<void> {
        // deletion is opt-in — with the flag off this method only logs the diff
        const pruneEnabled = parseEnvBoolean({
            key: "SYNC_PRUNE_ORPHANS",
            defaultValue: false,
        })
        // safety valve: refuse to delete when orphans dominate the index
        const maxRatio = parseEnvFloat({
            key: "SYNC_PRUNE_MAX_RATIO",
            defaultValue: 0.5,
        })
        // walk each entity index independently
        for (const target of this.targets) {
            // pull only the id column — that is the ES document _id
            const rows = await this.entityManager.find(target.entity,
                {
                    select: {
                        id: true,
                    },
                })
            // the ids that must remain in every locale's index
            const desiredIds = rows.map((row) => row.id)
            // each entity has one index per locale (`<base>-<locale>`)
            for (const locale of Object.values(Locale)) {
                // concrete index name for logging
                const index = this.elasticsearchService.indicateName({
                    entity: target.entityName,
                    locale,
                })
                // live document count in this index (0 when the index is absent)
                const existingCount = await this.elasticsearchService.countDocs({
                    entity: target.entityName,
                    locale,
                })
                // every desired id was just indexed → orphans are the surplus over desired
                const orphanCount = Math.max(0,
                    existingCount - desiredIds.length)
                // always surface the diff so the operator can see it even with pruning off
                this.winstonService.log(
                    WinstonLog.EsSynchronizerReconcileOrphansFound,
                    {
                        index,
                        existingCount,
                        desiredCount: desiredIds.length,
                        orphanCount,
                        pruneEnabled,
                    },
                )
                // nothing surplus → next index
                if (orphanCount === 0) {
                    continue
                }
                // ratio is 0 when the index is empty (nothing to prune anyway)
                const ratio = existingCount === 0
                    ? 0
                    : orphanCount / existingCount
                // too many orphans relative to total → likely a bad run; refuse to delete
                if (ratio > maxRatio) {
                    this.winstonService.log(
                        WinstonLog.EsSynchronizerReconcileSkippedBySafety,
                        {
                            index,
                            orphanCount,
                            existingCount,
                            ratio,
                            maxRatio,
                        },
                    )
                    continue
                }
                // diff-only mode: stop before any destructive action
                if (!pruneEnabled) {
                    continue
                }
                // delete every doc whose _id is not in the desired keep-list
                const deletedCount = await this.elasticsearchService.pruneOrphans({
                    entity: target.entityName,
                    locale,
                    ids: desiredIds,
                })
                // record what was actually removed
                this.winstonService.log(
                    WinstonLog.EsSynchronizerReconcileOrphansDeleted,
                    {
                        index,
                        deletedCount,
                    },
                )
            }
        }
    }
}
