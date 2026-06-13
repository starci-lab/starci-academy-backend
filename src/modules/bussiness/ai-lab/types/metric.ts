/** Outcome of scoring one eval case with a single metric. */
export interface MetricOutcome {
    /** Normalized score in [0, 1] for the case (before weighting). */
    score: number
    /** Whether the case is considered passed at this metric. */
    passed: boolean
}

/** Params for {@link AiLabEvalMetricService.exactMatch}. */
export interface ExactMatchParams {
    /** Model output produced for the case. */
    actualOutput: string
    /** Expected output to compare against (null = cannot match). */
    expectedOutput: string | null
}

/** Params for {@link AiLabEvalMetricService.containsMatch}. */
export interface ContainsMatchParams {
    /** Model output produced for the case. */
    actualOutput: string
    /** Substrings the output must contain (null / empty = cannot match). */
    expectedContains: Array<string> | null
}

/** Params for {@link AiLabEvalMetricService.embeddingMatch}. */
export interface EmbeddingMatchParams {
    /** Model output produced for the case. */
    actualOutput: string
    /** Expected output to compare against (null = cannot match). */
    expectedOutput: string | null
    /** Cosine-similarity threshold the case passes at (null → default). */
    embeddingThreshold: number | null
}

/** Params for {@link AiLabEvalMetricService.citationPresent}. */
export interface CitationPresentParams {
    /** Model output produced for the case. */
    actualOutput: string
}
