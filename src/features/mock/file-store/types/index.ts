/**
 * A single stored object for the presigned-URL lesson — the raw bytes a client
 * PUT to a signed URL, kept until the GET (download / preview) round-trip.
 */
export interface StoredObject {
    /** Raw uploaded bytes. */
    buffer: Buffer
    /** MIME type sent on the PUT, replayed on the GET so images render. */
    contentType: string
    /** Original filename, preserved for display. */
    filename: string
    /** Epoch ms of last access, used for TTL eviction. */
    lastAccessedAt: number
}

/**
 * An in-flight chunked-upload session (chunked-upload lesson). Tracks the
 * per-index byte slices so the client can resume from `missing[]`.
 */
export interface ChunkSession {
    /** Original filename declared at init. */
    filename: string
    /** Total file size in bytes declared at init. */
    size: number
    /** Fixed chunk size the client must slice by. */
    chunkSize: number
    /** Expected number of chunks (ceil(size / chunkSize)). */
    totalChunks: number
    /** Received chunks keyed by their zero-based index. */
    chunks: Map<number, Buffer>
    /** Whether finalize has run and the file is assembled. */
    finalized: boolean
    /** Epoch ms of last access, used for TTL eviction. */
    lastAccessedAt: number
}

/**
 * An in-flight tus upload (resumable-upload lesson). The byte offset advances
 * with every PATCH; HEAD reports it back so tus-js-client can resume.
 */
export interface TusUpload {
    /** Accumulated bytes appended so far (the tus Upload-Offset). */
    buffer: Buffer
    /** Declared total size (the tus Upload-Length). */
    length: number
    /** Raw Upload-Metadata header value, echoed back on HEAD. */
    metadata: string
    /** Epoch ms of last access, used for TTL eviction. */
    lastAccessedAt: number
}

/** Result of initialising a chunked-upload session. */
export interface InitChunkResult {
    /** Server-generated session id the client scopes subsequent calls by. */
    sessionId: string
    /** Expected number of chunks. */
    totalChunks: number
    /** Fixed chunk size to slice by. */
    chunkSize: number
}

/** Resume snapshot of a chunked-upload session. */
export interface ChunkStatus {
    /** Session id (echoed). */
    sessionId: string
    /** Expected number of chunks. */
    totalChunks: number
    /** Fixed chunk size. */
    chunkSize: number
    /** Indices already received. */
    received: Array<number>
    /** Indices still outstanding. */
    missing: Array<number>
    /** Whether the session has been finalized. */
    finalized: boolean
}

/** Assembled-file metadata returned by finalize. */
export interface FinalizeResult {
    /** Original filename. */
    filename: string
    /** Assembled size in bytes. */
    size: number
    /** Hex SHA-256 of the assembled bytes. */
    sha256: string
    /** Pseudo storage path for display. */
    path: string
}
