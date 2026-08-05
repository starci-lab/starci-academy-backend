import {
    DEFAULT_PAGINATION_LIMIT,
    MAX_PAGINATION_LIMIT,
} from "../constants/pagination"

/** A clamped, SQL/TypeORM-ready `limit`/`offset` pair. */
export interface PaginationWindow {
    limit: number
    offset: number
}

/**
 * Clamps a caller-supplied `limit`/`offset` pair into a safe pagination
 * window so a hostile or buggy client can never force an unbounded scan:
 * `limit` falls back to {@link DEFAULT_PAGINATION_LIMIT} when omitted, then
 * floors at 1 and ceilings at {@link MAX_PAGINATION_LIMIT}; `offset` floors
 * at 0. Extracted after this exact clamp (100-cap, 20-default) was
 * copy-pasted identically across five resolvers/handlers -- promote-on-the-
 * second-consumer, per naming-and-structure.md SS4.
 * @param limit - The caller-requested page size, or `null`/`undefined` to use the default.
 * @param offset - The caller-requested row offset, or `null`/`undefined` for the start of the list.
 * @returns The clamped `{ limit, offset }` window, safe to pass straight into a query.
 */
export const clampPagination = (
    limit?: number | null,
    offset?: number | null,
): PaginationWindow => ({
    limit: Math.min(
        Math.max(limit ?? DEFAULT_PAGINATION_LIMIT,
            1),
        MAX_PAGINATION_LIMIT,
    ),
    offset: Math.max(offset ?? 0,
        0),
})
