import {
    Client,
} from "@elastic/elasticsearch"
import type {
    Provider,
} from "@nestjs/common"
import {
    ELASTICSEARCH,
} from "./constants"
import {
    envConfig 
} from "@modules/env"

/**
 * Create a provider for the Elasticsearch client.
 */
export const createElasticsearchProvider = (): Provider => ({
    provide: ELASTICSEARCH,
    useFactory: () => {
        return new Client({
            node: envConfig().elasticsearch.node,
            auth: {
                username: envConfig().elasticsearch.username,
                password: envConfig().elasticsearch.password,
            },
        })
    },
})

