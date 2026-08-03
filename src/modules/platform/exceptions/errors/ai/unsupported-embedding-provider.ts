import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an embedding-model build that reached an unhandled provider. */
export interface UnsupportedEmbeddingProviderExceptionMetadata extends AbstractExceptionMetadata {
    /** The `ModelProvider` value that had no embeddings branch. */
    provider: string
}

/**
 * Thrown when {@link EmbeddingModelService} needs to build an `Embeddings`
 * client for a provider that has no embeddings branch (e.g. OpenRouter /
 * Anthropic, which do not serve an embeddings endpoint here).
 */
export class UnsupportedEmbeddingProviderException extends AbstractException {
    constructor({
        provider,
        originalError,
    }: UnsupportedEmbeddingProviderExceptionMetadata) {
        super(
            "Unsupported embedding provider.",
            "UNSUPPORTED_EMBEDDING_PROVIDER_EXCEPTION",
            {
                provider,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
