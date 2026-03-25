import {
    Provider,
} from "@nestjs/common"
import {
    QdrantClient,
} from "@qdrant/qdrant-js"
import {
    QDRANT_CLIENT,
} from "./constants"
import {
    envConfig 
} from "@modules/env"

/**
 * Creates provider for shared Qdrant REST client.
 *
 * @param param - Module options used to initialize client connection.
 * @returns Nest provider exposing initialized `QdrantClient`.
 */
export const createQdrantClientProvider = (): Provider => ({
    provide: QDRANT_CLIENT,
    useFactory: () => {
        // construct reusable Qdrant client from module connection options
        return new QdrantClient({
            url: envConfig().databases.qdrant.url,
            apiKey: envConfig().databases.qdrant.apiKey,
        })
    },
})
