import type {
    SyncArtifactResult,
} from "../../sync/types/sync"

/**
 * Minimal shape of a multer in-memory file. Declared locally so the module does
 * not depend on `@types/multer` (which is not installed in this workspace).
 */
export interface MulterFile {
    /** Original client-side filename. */
    originalname: string
    /** Detected MIME type. */
    mimetype: string
    /** Size in bytes. */
    size: number
    /** Buffered file contents (memory storage). */
    buffer: Buffer
}

/**
 * Parameters for {@link MediaService.execute}.
 */
export interface ProcessMediaParams {
    /** The uploaded source video (memory storage), or undefined when absent. */
    file: MulterFile | undefined
    /** Saved S3 target ids to sync the renditions to; empty keeps local-only. */
    targetIds: Array<string>
    /** Destination key prefix; a uuid-namespaced default is used when omitted. */
    keyPrefix?: string
}

/**
 * A single produced rendition on local disk.
 */
export interface MediaRendition {
    /** Output filename of the rendition (e.g. "720.mp4"). */
    name: string
    /** Size of the rendition in bytes. */
    sizeBytes: number
}

/**
 * Result of producing (and optionally syncing) the renditions.
 */
export interface ProcessMediaResult {
    /** Registry id of the produced artifact. */
    artifactId: string
    /** Local directory holding the encoded renditions. */
    localPath: string
    /** The produced renditions, one per bitrate profile. */
    renditions: Array<MediaRendition>
    /** Sync outcome, or null when no target was provided. */
    synced: SyncArtifactResult | null
}
