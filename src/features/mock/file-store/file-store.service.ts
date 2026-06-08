import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    BadRequestException,
    NotFoundException,
    ConflictException,
    PayloadTooLargeException,
} from "@nestjs/common"
import {
    randomUUID,
    createHash,
} from "crypto"
import type {
    StoredObject,
    ChunkSession,
    TusUpload,
    InitChunkResult,
    ChunkStatus,
    FinalizeResult,
} from "./types"

/** Entries idle longer than this are evicted by the background cleaner (30m). */
const ENTRY_TTL_MS = 30 * 60 * 1000

/** How often the cleanup interval runs (every 5 minutes). */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

/** Per-object byte cap (presigned PUT + tus total length). */
const MAX_OBJECT_BYTES = 10 * 1024 * 1024

/** Total byte cap across all chunks of one chunked-upload session. */
const MAX_CHUNK_SESSION_BYTES = 25 * 1024 * 1024

/** Fixed chunk size the chunked-upload client slices by (256 KB → visible progress). */
const CHUNK_SIZE = 256 * 1024

/**
 * Shared in-memory binary store for the file-upload lesson mocks.
 *
 * Holds three independent collections — presigned objects, chunked-upload
 * sessions, and tus uploads — each keyed by a server-generated id so different
 * sandbox clients never collide without needing a URL-injected session scope
 * (the file-upload lesson frontends talk to the bare origin). Entries are
 * evicted after 30 minutes idle and every write is byte-capped so the public
 * mock cannot be used to exhaust memory.
 */
@Injectable()
export class FileStoreService implements OnModuleInit, OnModuleDestroy {
    /** Presigned-URL objects keyed by object key. */
    private readonly objects = new Map<string, StoredObject>()

    /** Chunked-upload sessions keyed by session id. */
    private readonly chunkSessions = new Map<string, ChunkSession>()

    /** tus uploads keyed by upload id. */
    private readonly tusUploads = new Map<string, TusUpload>()

    /** Handle for the periodic eviction timer. */
    private cleanupHandle: NodeJS.Timeout | null = null

    onModuleInit(): void {
        // start the background cleanup loop to evict stale entries
        this.cleanupHandle = setInterval(
            () => {
                this.evictStale()
            },
            CLEANUP_INTERVAL_MS,
        )
    }

    onModuleDestroy(): void {
        // stop the cleanup loop on shutdown to avoid a hung process
        if (this.cleanupHandle) {
            clearInterval(this.cleanupHandle)
            this.cleanupHandle = null
        }
    }

    // ─── Presigned-URL lesson ────────────────────────────────────────────────

    /**
     * Builds a unique, URL-safe object key for a filename. The key embeds a
     * random uuid prefix so two uploads of the same name never collide.
     */
    generateObjectKey(filename: string): string {
        // strip path separators and unsafe chars, keep a recognisable name
        const safe = filename.replace(/[^a-zA-Z0-9._-]/g,
            "_") || "file"
        return `uploads/${randomUUID()}-${safe}`
    }

    /**
     * Stores the raw bytes a client PUT to a presigned URL.
     */
    putObject(
        key: string,
        buffer: Buffer,
        contentType: string,
        filename: string,
    ): void {
        // enforce the per-object cap before retaining the bytes
        if (buffer.length > MAX_OBJECT_BYTES) {
            throw new PayloadTooLargeException(`Object exceeds ${MAX_OBJECT_BYTES} bytes`)
        }

        this.objects.set(key,
            {
                buffer,
                contentType,
                filename,
                lastAccessedAt: Date.now(),
            })
    }

    /**
     * Returns a stored object by key, bumping its TTL, or throws 404.
     */
    getObject(key: string): StoredObject {
        const object = this.objects.get(key)
        if (!object) {
            throw new NotFoundException(`Object ${key} not found`)
        }

        // bump last-accessed so an actively-previewed object is not evicted
        object.lastAccessedAt = Date.now()
        return object
    }

    // ─── Chunked-upload lesson ───────────────────────────────────────────────

    /**
     * Creates a chunked-upload session and returns the slicing parameters the
     * client must use (the client slices the file by the returned chunkSize).
     */
    initChunkSession(filename: string, size: number): InitChunkResult {
        // a declared size beyond the cap is rejected up front
        if (size > MAX_CHUNK_SESSION_BYTES) {
            throw new PayloadTooLargeException(`File exceeds ${MAX_CHUNK_SESSION_BYTES} bytes`)
        }
        if (!Number.isFinite(size) || size <= 0) {
            throw new BadRequestException("size must be a positive number")
        }

        const sessionId = randomUUID()
        // ceil so the trailing partial chunk is counted
        const totalChunks = Math.max(1,
            Math.ceil(size / CHUNK_SIZE))

        this.chunkSessions.set(sessionId,
            {
                filename,
                size,
                chunkSize: CHUNK_SIZE,
                totalChunks,
                chunks: new Map<number, Buffer>(),
                finalized: false,
                lastAccessedAt: Date.now(),
            })

        return {
            sessionId,
            totalChunks,
            chunkSize: CHUNK_SIZE,
        }
    }

    /**
     * Stores one chunk at its index for a session.
     */
    putChunk(sessionId: string, index: number, buffer: Buffer): void {
        const session = this.requireChunkSession(sessionId)

        // index must fall inside the expected range for this file
        if (!Number.isInteger(index) || index < 0 || index >= session.totalChunks) {
            throw new BadRequestException(`index ${index} out of range`)
        }

        // reject if this chunk would push the session over its byte cap
        const projected = this.sessionBytes(session) - (session.chunks.get(index)?.length ?? 0) + buffer.length
        if (projected > MAX_CHUNK_SESSION_BYTES) {
            throw new PayloadTooLargeException(`Session exceeds ${MAX_CHUNK_SESSION_BYTES} bytes`)
        }

        session.chunks.set(index,
            buffer)
    }

    /**
     * Returns the received/missing bitmaps for a session (resume support).
     */
    getChunkStatus(sessionId: string): ChunkStatus {
        const session = this.requireChunkSession(sessionId)

        const received: Array<number> = []
        const missing: Array<number> = []
        // walk every expected index and bucket it as received or missing
        for (let index = 0; index < session.totalChunks; index++) {
            if (session.chunks.has(index)) {
                received.push(index)
            } else {
                missing.push(index)
            }
        }

        return {
            sessionId,
            totalChunks: session.totalChunks,
            chunkSize: session.chunkSize,
            received,
            missing,
            finalized: session.finalized,
        }
    }

    /**
     * Assembles all chunks in order, hashes the result, and returns metadata.
     * Throws if any chunk is still missing.
     */
    finalizeChunkSession(sessionId: string): FinalizeResult {
        const session = this.requireChunkSession(sessionId)

        // every index must be present before we can assemble
        if (session.chunks.size !== session.totalChunks) {
            throw new BadRequestException(`Cannot finalize: ${session.totalChunks - session.chunks.size} chunk(s) missing`)
        }

        // concatenate chunks strictly in index order
        const ordered: Array<Buffer> = []
        for (let index = 0; index < session.totalChunks; index++) {
            ordered.push(session.chunks.get(index)!)
        }
        const assembled = Buffer.concat(ordered)

        session.finalized = true

        return {
            filename: session.filename,
            size: assembled.length,
            sha256: createHash("sha256").update(assembled).digest("hex"),
            path: `uploads/${sessionId}/${session.filename}`,
        }
    }

    // ─── tus resumable-upload lesson ─────────────────────────────────────────

    /**
     * Creates a tus upload slot and returns its id. `length` is the declared
     * Upload-Length; `metadata` is the raw Upload-Metadata header (echoed back).
     */
    createTusUpload(length: number, metadata: string): string {
        if (!Number.isFinite(length) || length < 0) {
            throw new BadRequestException("Upload-Length must be a non-negative number")
        }
        if (length > MAX_OBJECT_BYTES) {
            throw new PayloadTooLargeException(`Upload exceeds ${MAX_OBJECT_BYTES} bytes`)
        }

        const id = randomUUID()
        this.tusUploads.set(id,
            {
                buffer: Buffer.alloc(0),
                length,
                metadata,
                lastAccessedAt: Date.now(),
            })
        return id
    }

    /**
     * Returns a tus upload by id (bumping TTL), or throws 404.
     */
    getTusUpload(id: string): TusUpload {
        const upload = this.tusUploads.get(id)
        if (!upload) {
            throw new NotFoundException(`Upload ${id} not found`)
        }
        upload.lastAccessedAt = Date.now()
        return upload
    }

    /**
     * Appends a PATCH body at `offset` and returns the new offset. Enforces the
     * tus contract that the client offset must equal the current byte count.
     */
    appendTus(id: string, offset: number, buffer: Buffer): number {
        const upload = this.getTusUpload(id)

        // tus requires the PATCH offset to match exactly where we left off
        if (offset !== upload.buffer.length) {
            throw new ConflictException(`Offset ${offset} does not match current ${upload.buffer.length}`)
        }

        // never let the appended bytes exceed the declared length
        if (upload.buffer.length + buffer.length > upload.length) {
            throw new BadRequestException("Appended bytes exceed declared Upload-Length")
        }

        upload.buffer = Buffer.concat([upload.buffer,
            buffer])
        return upload.buffer.length
    }

    // ─── Internals ───────────────────────────────────────────────────────────

    /** Resolves a chunk session by id (bumping TTL), or throws 404. */
    private requireChunkSession(sessionId: string): ChunkSession {
        const session = this.chunkSessions.get(sessionId)
        if (!session) {
            throw new NotFoundException(`Upload session ${sessionId} not found`)
        }
        session.lastAccessedAt = Date.now()
        return session
    }

    /** Sums the byte length of every stored chunk in a session. */
    private sessionBytes(session: ChunkSession): number {
        let total = 0
        for (const chunk of session.chunks.values()) {
            total += chunk.length
        }
        return total
    }

    /** Removes entries across all collections that have gone idle past the TTL. */
    private evictStale(): void {
        const cutoff = Date.now() - ENTRY_TTL_MS

        for (const [key,
            object] of this.objects.entries()) {
            if (object.lastAccessedAt < cutoff) {
                this.objects.delete(key)
            }
        }
        for (const [id,
            session] of this.chunkSessions.entries()) {
            if (session.lastAccessedAt < cutoff) {
                this.chunkSessions.delete(id)
            }
        }
        for (const [id,
            upload] of this.tusUploads.entries()) {
            if (upload.lastAccessedAt < cutoff) {
                this.tusUploads.delete(id)
            }
        }
    }
}
