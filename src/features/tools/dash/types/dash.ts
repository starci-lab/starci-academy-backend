import type {
    MulterFile,
} from "../../media/types/media"
import type {
    SyncArtifactResult,
} from "../../sync/types/sync"

/**
 * Parameters for {@link DashService.execute}.
 */
export interface ProcessDashParams {
    /** The uploaded source video (memory storage), or undefined when absent. */
    file: MulterFile | undefined
    /** Saved S3 target ids to sync the DASH output to; empty keeps local-only. */
    targetIds: Array<string>
    /** Destination key prefix; a uuid-namespaced default is used when omitted. */
    keyPrefix?: string
}

/**
 * Result of producing (and optionally syncing) a DASH artifact.
 */
export interface ProcessDashResult {
    /** Registry id of the produced artifact. */
    artifactId: string
    /** Local directory holding the encoded mp4s, fragments and DASH output. */
    localPath: string
    /** Object key of the DASH manifest once synced (null when local-only). */
    manifestKey: string | null
    /** Sync outcome, or null when no target was provided. */
    synced: SyncArtifactResult | null
}
