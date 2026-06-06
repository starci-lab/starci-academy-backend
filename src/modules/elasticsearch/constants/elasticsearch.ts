/**
 * Elasticsearch module constant.
 */
export const ELASTICSEARCH = "ELASTICSEARCH"

/**
 * Base index name for coding-problem "approach hint" markdown documents.
 * Hints live ONLY in Elasticsearch (never Postgres/CDN); the per-locale index
 * is `coding-problem-hints-<locale>` and each document is keyed by problem slug.
 */
export const CODING_PROBLEM_HINT_INDEX = "coding-problem-hints"

/**
 * Build the per-locale coding-problem-hint index name.
 * @param locale - locale code (e.g. `en`, `vi`)
 * @returns the index name, e.g. `coding-problem-hints-en`
 */
export const codingProblemHintIndexName = (locale: string): string =>
    `${CODING_PROBLEM_HINT_INDEX}-${locale}`