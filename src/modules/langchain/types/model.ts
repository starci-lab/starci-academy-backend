import {
    ModelProvider,
} from "@modules/databases"

/** Context for getting an embedding model. */
export interface GetEmbeddingModelParams {
    /** The model to get. */
    model: string
    /** The provider of the model. */
    provider: ModelProvider
}