/** Verbose per-entity sync success log payload (CDN / Elasticsearch / Indexer). */
export interface SyncSuccessLogPayload {
    /** TypeORM entity class name (e.g. `ChallengeEntity`). */
    entityKind: string
    /** Entity primary key. */
    entityId: string
    /** Mount slug / display id of the synced row. */
    displayId: string
    /** Ancestor display ids from course -> ... -> parent (empty for course). */
    relativeDisplayIds: Array<string>
    /** `true` when row uses legacy mount schema (no `# verified` / `verified` null). */
    isLegacy?: boolean
}
