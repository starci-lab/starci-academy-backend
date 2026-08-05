/**
 * Default page size applied by {@link clampPagination} when a paginated
 * query's caller omits `limit`. Kept as its own export (rather than inlined
 * into the helper) because a handful of resolvers also surface it in a
 * GraphQL `@Args` default or an API description string.
 */
export const DEFAULT_PAGINATION_LIMIT = 20

/**
 * Hard ceiling on page size shared by every list query that has not tuned
 * its own cap. A client-supplied `limit` above this is clamped down, never
 * rejected, so a hostile or buggy caller can never force an unbounded scan.
 * Extracted after this exact constant (100) + clamp shape was copy-pasted
 * identically across learner-cms, notification, job-postings, cv-generations
 * and due-flashcards -- see `utils/pagination.ts`.
 */
export const MAX_PAGINATION_LIMIT = 100
