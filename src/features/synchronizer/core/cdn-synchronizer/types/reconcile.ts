import type {
    EntityTarget,
    ObjectLiteral,
} from "typeorm"
import type {
    S3Provider,
} from "@modules/s3"

/** One entity → CDN key-prefix target the reconcile pass scans. */
export interface CdnReconcileTarget {
    /** TypeORM entity class to read live ids/displayIds from. */
    entity: EntityTarget<ObjectLiteral>
    /** First path segment of the CDN object keys for this entity (e.g. `courses`). */
    prefix: string
}

/** Params for reconciling a single prefix on a single S3 provider. */
export interface ReconcilePrefixOnProviderParams {
    /** First path segment of the CDN keys (e.g. `courses`). */
    prefix: string
    /** Provider whose bucket to scan and prune. */
    provider: S3Provider
    /** Live id/displayId segments that must be kept. */
    desiredSegments: Set<string>
    /** Whether deletion is enabled this run (`SYNC_PRUNE_ORPHANS`). */
    pruneEnabled: boolean
    /** Maximum tolerated orphan ratio before the safety valve trips. */
    maxRatio: number
}
