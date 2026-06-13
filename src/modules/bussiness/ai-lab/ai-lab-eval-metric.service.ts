import {
    Injectable,
} from "@nestjs/common"
import {
    ModelProvider,
} from "@modules/databases"
import {
    EmbeddingModelService,
} from "@modules/langchain"
import {
    envConfig,
} from "@modules/env"
import {
    DEFAULT_EMBEDDING_THRESHOLD,
} from "./constants"
import type {
    CitationPresentParams,
    ContainsMatchParams,
    EmbeddingMatchParams,
    ExactMatchParams,
    MetricOutcome,
} from "./types"

/** Regex matching a markdown link or a bare URL, used to detect a citation. */
const CITATION_PATTERN = /\[[^\]]+\]\([^)]+\)|https?:\/\/\S+/i

/**
 * Stateless metric helpers used to score one eval-case output. Exact / contains
 * / citation are pure string checks; embedding similarity uses the shared
 * {@link EmbeddingModelService} to compute cosine similarity between the
 * candidate and expected outputs.
 */
@Injectable()
export class AiLabEvalMetricService {
    constructor(
        private readonly embeddingModelService: EmbeddingModelService,
    ) { }

    /**
     * Exact-match metric: the trimmed, case-insensitive output must equal the
     * expected output.
     *
     * @param params - Actual + expected output.
     * @returns 1 / pass on an exact match, 0 / fail otherwise.
     */
    exactMatch(
        {
            actualOutput,
            expectedOutput,
        }: ExactMatchParams,
    ): MetricOutcome {
        // no expected value → the case is unscoreable on exact match (treat as fail)
        if (expectedOutput === null) {
            return {
                score: 0,
                passed: false,
            }
        }
        // compare trimmed + lower-cased so trailing whitespace / casing do not fail a match
        const matched = actualOutput.trim().toLowerCase()
            === expectedOutput.trim().toLowerCase()
        return {
            score: matched
                ? 1
                : 0,
            passed: matched,
        }
    }

    /**
     * Contains metric: the output must contain every expected substring
     * (case-insensitive). Score is the fraction of substrings present; pass
     * requires all of them.
     *
     * @param params - Actual output + required substrings.
     * @returns Fractional score and all-present pass flag.
     */
    containsMatch(
        {
            actualOutput,
            expectedContains,
        }: ContainsMatchParams,
    ): MetricOutcome {
        // no required substrings → nothing to check, treat as unscoreable fail
        if (!expectedContains || expectedContains.length === 0) {
            return {
                score: 0,
                passed: false,
            }
        }
        // lower-case once so each substring check is case-insensitive
        const haystack = actualOutput.toLowerCase()
        // count how many required substrings are present
        const presentCount = expectedContains.filter(
            (substring) => haystack.includes(substring.toLowerCase()),
        ).length
        // fractional score = present / total; pass only when every substring is present
        return {
            score: presentCount / expectedContains.length,
            passed: presentCount === expectedContains.length,
        }
    }

    /**
     * Embedding metric: cosine similarity between the candidate and expected
     * outputs must clear the case threshold.
     *
     * @param params - Actual + expected output and the pass threshold.
     * @returns Similarity-as-score and threshold pass flag.
     */
    async embeddingMatch(
        {
            actualOutput,
            expectedOutput,
            embeddingThreshold,
        }: EmbeddingMatchParams,
    ): Promise<MetricOutcome> {
        // no expected value → unscoreable on similarity (treat as fail)
        if (expectedOutput === null) {
            return {
                score: 0,
                passed: false,
            }
        }
        // reuse the project-wide embedding config (provider + model) so AI Lab
        // similarity uses the same vector space as the rest of the grading stack
        const embeddingConfig = envConfig().services.githubWorker
            .processGitSubmission.embedding
        const embeddingModel = this.embeddingModelService.get({
            model: embeddingConfig.model,
            provider: embeddingConfig.provider as ModelProvider,
        })
        // embed both texts and compute cosine similarity between the two vectors
        const [
            actualVector,
            expectedVector,
        ] = await Promise.all([
            embeddingModel.embedQuery(actualOutput),
            embeddingModel.embedQuery(expectedOutput),
        ])
        const similarity = this.cosineSimilarity(
            actualVector,
            expectedVector,
        )
        // fall back to the module default threshold when the case pins none
        const threshold = embeddingThreshold ?? DEFAULT_EMBEDDING_THRESHOLD
        return {
            // clamp to [0, 1] — cosine of embedding vectors can dip slightly negative
            score: Math.max(
                0,
                Math.min(
                    1,
                    similarity,
                ),
            ),
            passed: similarity >= threshold,
        }
    }

    /**
     * Citation metric: returns whether the output contains at least one markdown
     * link or bare URL (used for RAG cases that must cite a source).
     *
     * @param params - The candidate output.
     * @returns True when a citation pattern is found.
     */
    citationPresent(
        {
            actualOutput,
        }: CitationPresentParams,
    ): boolean {
        // a citation is any markdown link or bare URL in the output
        return CITATION_PATTERN.test(actualOutput)
    }

    /**
     * Cosine similarity between two equal-length embedding vectors.
     *
     * @param first - First embedding vector.
     * @param second - Second embedding vector.
     * @returns Cosine similarity in [-1, 1] (0 when either vector is zero-length).
     */
    private cosineSimilarity(
        first: Array<number>,
        second: Array<number>,
    ): number {
        // accumulate the dot product and each vector's squared magnitude in one pass
        let dot = 0
        let firstMagnitude = 0
        let secondMagnitude = 0
        for (let index = 0; index < first.length; index++) {
            const firstComponent = first[index]
            const secondComponent = second[index] ?? 0
            dot += firstComponent * secondComponent
            firstMagnitude += firstComponent * firstComponent
            secondMagnitude += secondComponent * secondComponent
        }
        // guard against a zero-length vector (would divide by zero) → no similarity
        const denominator = Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude)
        if (denominator === 0) {
            return 0
        }
        return dot / denominator
    }
}
