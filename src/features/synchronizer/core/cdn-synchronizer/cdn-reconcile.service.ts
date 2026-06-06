import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    CourseEntity,
    ChallengeEntity,
    ContentEntity,
    ModuleEntity,
} from "@modules/databases"
import {
    type EntityManager,
} from "typeorm"
import {
    S3Provider,
    S3ReadService,
    S3DeleteService,
} from "@modules/s3"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    parseEnvBoolean,
    parseEnvFloat,
} from "@modules/env"
import type {
    CdnReconcileTarget,
    ReconcilePrefixOnProviderParams,
} from "./types"

/**
 * CDN reconcile — diffs the object keys currently stored on each S3 provider
 * against the id/displayId set the database says should exist, logs the diff,
 * and (when enabled) deletes the orphaned keys.
 *
 * Runs after {@link CdnSynchronizerService} has uploaded the live entities, so
 * every desired key is guaranteed present before we compute what is surplus.
 */
@Injectable()
export class CdnReconcileService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3ReadService: S3ReadService,
        private readonly s3DeleteService: S3DeleteService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Entity → key-prefix targets to reconcile. The prefix is the first path
     * segment of every CDN key (e.g. `courses/<id>/vi.json`).
     */
    private readonly targets: Array<CdnReconcileTarget> = [
        {
            entity: CourseEntity,
            prefix: "courses",
        },
        {
            entity: ChallengeEntity,
            prefix: "challenges",
        },
        {
            entity: ContentEntity,
            prefix: "contents",
        },
        {
            entity: ModuleEntity,
            prefix: "modules",
        },
    ]

    /** S3 providers that receive CDN uploads — both must be reconciled. */
    private readonly providers: Array<S3Provider> = [
        S3Provider.Minio,
        //S3Provider.DigitalOcean,
    ]

    /**
     * Reconcile every entity prefix on every provider: log the orphan diff and,
     * when `SYNC_PRUNE_ORPHANS=true`, delete the orphaned keys.
     */
    async reconcileAll(): Promise<void> {
        // deletion is opt-in — with the flag off this method only logs the diff
        const pruneEnabled = parseEnvBoolean({
            key: "SYNC_PRUNE_ORPHANS",
            defaultValue: false,
        })
        // safety valve: refuse to delete when orphans dominate (guards against a
        // misconfigured/empty database that would otherwise wipe the whole CDN)
        const maxRatio = parseEnvFloat({
            key: "SYNC_PRUNE_MAX_RATIO",
            defaultValue: 0.5,
        })
        // walk each entity prefix independently so a failure on one doesn't block the rest
        for (const target of this.targets) {
            // pull only the two columns that form CDN key segments — id and displayId
            const rows = await this.entityManager.find(target.entity,
                {
                    select: {
                        id: true,
                        displayId: true,
                    },
                })
            // the desired segment set = every live id AND every live displayId (keys exist under both)
            const desiredSegments = new Set<string>()
            for (const row of rows) {
                desiredSegments.add(row.id)
                // displayId may be null on legacy rows → only add real values
                if (row.displayId) {
                    desiredSegments.add(row.displayId)
                }
            }
            // reconcile this prefix on each provider (Minio + DigitalOcean diverge independently)
            for (const provider of this.providers) {
                await this.reconcilePrefixOnProvider({
                    prefix: target.prefix,
                    provider,
                    desiredSegments,
                    pruneEnabled,
                    maxRatio,
                })
            }
        }
    }

    /**
     * Reconcile a single prefix on a single provider.
     */
    private async reconcilePrefixOnProvider(
        {
            prefix,
            provider,
            desiredSegments,
            pruneEnabled,
            maxRatio,
        }: ReconcilePrefixOnProviderParams,
    ): Promise<void> {
        // list every object key under `<prefix>/` for this provider
        const existingKeys = await this.s3ReadService.listAll({
            prefix: `${prefix}/`,
            provider,
        })
        // map each key to its segment (path part after the prefix), ignoring any
        // direct `<prefix>/x.json` object — only `<prefix>/<segment>/<locale>.json` is ours
        const existingSegments = new Set<string>()
        for (const key of existingKeys) {
            const parts = key.split("/")
            // need at least prefix + segment + filename to be a managed key
            if (parts.length >= 3 && parts[1]) {
                existingSegments.add(parts[1])
            }
        }
        // orphan = present in the store but not backed by a live db row
        const orphanSegments = [...existingSegments].filter(
            (segment) => !desiredSegments.has(segment),
        )
        // always surface the diff so the operator can see it even with pruning off
        this.winstonService.log(
            WinstonLog.CdnSynchronizerReconcileOrphansFound,
            {
                provider,
                prefix,
                existingCount: existingSegments.size,
                desiredCount: desiredSegments.size,
                orphanCount: orphanSegments.length,
                // cap the sample so the log line stays readable
                sampleOrphans: orphanSegments.slice(0,
                    10),
                pruneEnabled,
            },
        )
        // nothing surplus → done with this prefix/provider
        if (orphanSegments.length === 0) {
            return
        }
        // ratio is 0 when the store is empty (no existing → nothing to prune anyway)
        const ratio = existingSegments.size === 0
            ? 0
            : orphanSegments.length / existingSegments.size
        // too many orphans relative to total → likely a bad run; refuse to delete
        if (ratio > maxRatio) {
            this.winstonService.log(
                WinstonLog.CdnSynchronizerReconcileSkippedBySafety,
                {
                    provider,
                    prefix,
                    orphanCount: orphanSegments.length,
                    existingCount: existingSegments.size,
                    ratio,
                    maxRatio,
                },
            )
            return
        }
        // diff-only mode: stop before any destructive action
        if (!pruneEnabled) {
            return
        }
        // resolve the concrete object keys belonging to orphan segments
        const orphanSegmentSet = new Set(orphanSegments)
        const orphanKeys = existingKeys.filter((key) => {
            const parts = key.split("/")
            // delete only managed `<prefix>/<segment>/<file>` keys whose segment is orphaned
            return parts.length >= 3 && parts[1] !== undefined && orphanSegmentSet.has(parts[1])
        })
        // remove every orphan key from this provider's bucket
        const deletedKeyCount = await this.s3DeleteService.deleteObjects({
            keys: orphanKeys,
            provider,
        })
        // record what was actually removed
        this.winstonService.log(
            WinstonLog.CdnSynchronizerReconcileOrphansDeleted,
            {
                provider,
                prefix,
                orphanSegmentCount: orphanSegments.length,
                deletedKeyCount,
            },
        )
    }
}
