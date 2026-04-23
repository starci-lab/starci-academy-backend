import {
    Provider,
} from "@nestjs/common"
import {
    auth,
    Client,
} from "cassandra-driver"
import {
    envConfig,
} from "@modules/env"
import {
    SCYLLADB_CLIENT,
} from "./constants"

/**
 * Creates provider for shared ScyllaDB client.
 *
 * @returns Nest provider exposing initialized `Client`.
 */
export const createScyllaDBClientProvider = (): Provider => ({
    provide: SCYLLADB_CLIENT,
    useFactory: async () => {
        const config = envConfig().databases.scylladb
        const authProvider = config.username && config.password
            ? new auth.PlainTextAuthProvider(config.username,
                config.password)
            : undefined

        const client = new Client({
            contactPoints: config.contactPoints,
            localDataCenter: config.localDataCenter,
            keyspace: config.keyspace,
            authProvider,
            protocolOptions: {
                port: config.port,
            },
        })

        await client.connect()
        return client
    },
})
