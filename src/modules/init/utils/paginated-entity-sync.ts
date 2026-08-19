/**
 * Parameters driving one paginated, cursor-resumed walk over a TypeORM entity
 * kind.
 *
 * Shared by every init synchronizer (Elasticsearch, Indexer, CDN): each walks
 * its own entity kinds through the exact same id-cursor pagination, scope-skip
 * and per-row failure handling, differing only in which row-fetcher and builder
 * it drives and how it shapes its own success / failure log payloads.
 */
export interface PaginatedEntitySyncParams<TEntity extends { id: string }> {
    /** Loads the next row after `resumeEntityId` in `id ASC` order (`null` when exhausted). */
    fetchNext: (resumeEntityId: string | null) => Promise<TEntity | null>
    /** Scope gate; a row failing this is skipped (the cursor still advances past it). */
    shouldSync?: (entity: TEntity) => boolean
    /** Syncs one row into the destination (search index / projection / CDN object). */
    build: (entity: TEntity) => Promise<void>
    /** Called after a row's `build` resolves. */
    onSynced: (entity: TEntity) => void
    /** Called when a row's `build` rejects; the walk always continues past it. */
    onFailed: (entityId: string, error: unknown) => void
}

/**
 * Walk every row of one entity kind in `id ASC` order, resuming from the last
 * seen id so a page is never re-read. A row that fails `shouldSync` is skipped
 * (the cursor still advances past it); a row whose `build` rejects is reported
 * via `onFailed` and the walk continues -- one bad row never stops the sink from
 * reaching the rows after it.
 *
 * @param params - {@link PaginatedEntitySyncParams} for the entity kind to walk
 */
export const runPaginatedEntitySync = async <TEntity extends { id: string }>(
    params: PaginatedEntitySyncParams<TEntity>,
): Promise<void> => {
    let resumeEntityId: string | null = null
    while (true) {
        const entity = await params.fetchNext(resumeEntityId)
        if (!entity) {
            break
        }
        if (params.shouldSync && !params.shouldSync(entity)) {
            resumeEntityId = entity.id
            continue
        }
        try {
            await params.build(entity)
            params.onSynced(entity)
        } catch (error) {
            params.onFailed(entity.id,
                error)
        }
        resumeEntityId = entity.id
    }
}
