/**
 * A single database to snapshot — a human label plus its connection URL.
 */
export interface PgSnapshotTarget {
    /** Operator-facing label; also used (slugified) in the dump filename. */
    name: string
    /** Full `postgres://user:pass@host:port/db` connection URL. */
    url: string
}

/**
 * Parameters for {@link PgSnapshotService.execute}.
 */
export interface PgSnapshotParams {
    /** The list of cloud databases to dump to local files. */
    targets: Array<PgSnapshotTarget>
}

/**
 * Outcome of dumping one target database.
 */
export interface PgSnapshotItemResult {
    /** The label of the target this result belongs to. */
    name: string
    /** Whether the dump completed and produced a non-empty file. */
    ok: boolean
    /** Absolute path of the written `.dump` file (present when `ok`). */
    file?: string
    /** Size of the written dump in bytes (present when `ok`). */
    sizeBytes?: number
    /** Registry id of the produced artifact (present when `ok`). */
    artifactId?: string
    /** Failure reason when `ok` is false. */
    error?: string
}

/**
 * Result of a snapshot run across every requested target.
 */
export interface PgSnapshotResult {
    /** Directory the dumps were written into. */
    directory: string
    /** Per-target outcomes, in request order. */
    items: Array<PgSnapshotItemResult>
}

/**
 * Params for {@link PgSnapshotService.dumpOne}.
 */
export interface DumpOneParams {
    /** The target database to dump. */
    target: PgSnapshotParams["targets"][number]
    /** Directory the dump file is written into. */
    directory: string
    /** Run timestamp shared by every target in the same snapshot run, used in the filename. */
    runStamp: number
}
