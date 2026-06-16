/**
 * Extract the entity id-or-displayId segment from a CDN object key.
 *
 * CDN keys are `<prefix><idOrDisplayId>.json` or
 * `<prefix><idOrDisplayId>/<locale>.json` (the same object is uploaded both by
 * id and by displayId, with and without a locale suffix). The leading segment
 * after the prefix is the id-or-displayId we reconcile against the live DB set.
 *
 * @param key - Full CDN object key (e.g. `courses/abc-123/vi.json`)
 * @param prefix - Entity-type prefix WITH a trailing slash (e.g. `courses/`)
 * @returns The id/displayId segment, or `null` when the key is outside the prefix
 */
export const segmentFromCdnKey = (
    key: string,
    prefix: string,
): string | null => {
    if (!key.startsWith(prefix)) {
        return null
    }
    // `<seg>.json` (locale-less) or `<seg>/<locale>.json` → first path part is the seg
    const first = key.slice(prefix.length).split("/")[0]
    const segment = first.replace(/\.json$/u,
        "")
    return segment.length > 0
        ? segment
        : null
}

/** Result of partitioning CDN keys into live vs orphan. */
export interface PartitionCdnKeysResult {
    /** Keys whose id/displayId segment is NOT in the live set → safe to delete. */
    orphanKeys: Array<string>
    /** Distinct id/displayId segments seen across all keys. */
    totalSegments: number
    /** Distinct segments that are orphaned (not in the live set). */
    orphanSegments: number
}

/**
 * Partition CDN keys into orphans (segment not in the live id/displayId set) and
 * collect distinct-segment counts for the ratio guard.
 *
 * @param keys - All CDN keys listed under the entity-type prefix
 * @param prefix - Entity-type prefix WITH a trailing slash
 * @param liveSet - Live entity ids ∪ displayIds from the database
 * @returns The orphan keys plus distinct total/orphan segment counts
 */
export const partitionOrphanCdnKeys = (
    keys: Array<string>,
    prefix: string,
    liveSet: Set<string>,
): PartitionCdnKeysResult => {
    const segments = new Set<string>()
    const orphanSegments = new Set<string>()
    const orphanKeys: Array<string> = []
    for (const key of keys) {
        const segment = segmentFromCdnKey(key,
            prefix)
        if (segment === null) {
            continue
        }
        segments.add(segment)
        if (!liveSet.has(segment)) {
            orphanSegments.add(segment)
            orphanKeys.push(key)
        }
    }
    return {
        orphanKeys,
        totalSegments: segments.size,
        orphanSegments: orphanSegments.size,
    }
}

/**
 * Whether deleting `orphan` out of `total` entries exceeds the safety ratio.
 *
 * When true the caller skips the prune (with a warning) — this catches the
 * catastrophic case where the DB returned nothing and we'd otherwise wipe the
 * entire index/prefix.
 *
 * @param orphan - Number of entries that would be deleted
 * @param total - Total number of entries present
 * @param maxRatio - Maximum allowed delete fraction (0..1)
 * @returns True when the prune should be skipped as unsafe
 */
export const exceedsPruneRatio = (
    orphan: number,
    total: number,
    maxRatio: number,
): boolean => {
    // nothing present → nothing to over-delete
    if (total <= 0) {
        return false
    }
    return orphan / total > maxRatio
}
