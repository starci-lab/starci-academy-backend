import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

/** Context for getting an embedding model. */
export interface GetEmbeddingModelParams {
    /** The model to get. */
    model: string
    /** The provider of the model. */
    provider: ModelProvider
}