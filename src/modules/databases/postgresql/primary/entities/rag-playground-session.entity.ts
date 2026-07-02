import {
    Column,
    Entity,
    Index,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"

/**
 * One PUBLIC (no-login) RAG Playground session: an anonymous visitor's
 * imported code (paste / upload / sample / GitHub repo), indexed into an
 * ephemeral Qdrant collection named `playground-${sessionId}`. Tracks the
 * collection's lifecycle so a cron ({@link import("../../../../rag").PublicRagPlaygroundCleanupService})
 * can drop idle sessions instead of leaking Qdrant collections forever — the
 * ONE piece of this demo feature that is persisted (Q&A turns are NOT stored;
 * see {@link import("../../../../rag").RagPlaygroundRunRegistryService}, in-memory only).
 */
@Entity("rag_playground_sessions")
// cron cleanup scans idle sessions by lastAccessedAt
@Index("idx_rag_playground_sessions_last_accessed",
    [
        "lastAccessedAt",
    ])
export class RagPlaygroundSessionEntity extends UuidAbstractEntity {
    /** Client-generated session id (also drives the Qdrant collection name). */
    @Column({
        name: "session_id",
        type: "varchar",
        unique: true,
    })
        sessionId: string

    /** How the code was imported — "paste" | "upload" | "sample" | "github". */
    @Column({
        name: "source_kind",
        type: "varchar",
    })
        sourceKind: string

    /** Human-readable label for the imported source (file name / repo / "Repo mẫu"). */
    @Column({
        name: "source_label",
        type: "varchar",
        nullable: true,
    })
        sourceLabel: string | null

    /** How many chunks were indexed for this session. */
    @Column({
        name: "chunk_count",
        type: "int",
    })
        chunkCount: number

    /** Bumped on every ask; the cron drops sessions idle past the TTL. */
    @Column({
        name: "last_accessed_at",
        type: "timestamptz",
    })
        lastAccessedAt: Date
}
