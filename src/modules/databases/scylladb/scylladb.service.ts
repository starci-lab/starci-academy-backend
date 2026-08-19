import {
    Injectable,
} from "@nestjs/common"
import {
    Client,
} from "cassandra-driver"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    InjectScyllaDBClient,
} from "./scylladb.decorators"
import {
    InvalidScyllaIdentifierException,
} from "@modules/platform/exceptions/errors/scylladb/invalid-scylla-identifier"

@Injectable()
/** Shared ScyllaDB helper for schema bootstrap and document upsert operations. */
export class ScyllaDBService {
    private readonly ensuredTables = new Set<string>()

    constructor(
        @InjectScyllaDBClient()
        private readonly client: Client,
    ) {
    }

    /**
     * Upserts a localized document into ScyllaDB using `(id, locale)` as primary key.
     */
    async upsertLocalizedDocument(
        tableName: string,
        id: string,
        locale: string,
        payload: unknown,
    ) {
        const keyspace = this.sanitizeIdentifier(envConfig().databases.scylladb.keyspace)
        const table = this.sanitizeIdentifier(tableName)
        await this.ensureSyncTable(table)

        await this.client.execute(
            `INSERT INTO ${keyspace}.${table} (id, locale, payload, updated_at) VALUES (?, ?, ?, toTimestamp(now()))`,
            [
                id,
                locale,
                JSON.stringify(payload),
            ],
            {
                prepare: true,
            },
        )
    }

    /**
     * Reads all localized documents for a locale from a sync table.
     */
    async findLocalizedDocuments<T>(
        tableName: string,
        locale: string,
    ): Promise<Array<T>> {
        const keyspace = this.sanitizeIdentifier(envConfig().databases.scylladb.keyspace)
        const table = this.sanitizeIdentifier(tableName)
        await this.ensureSyncTable(table)

        const response = await this.client.execute(
            `SELECT payload FROM ${keyspace}.${table} WHERE locale = ? ALLOW FILTERING`,
            [
                locale,
            ],
            {
                prepare: true,
            },
        )

        return response.rows.flatMap((row) => {
            const payload = row.get("payload")
            if (typeof payload !== "string") {
                return []
            }

            try {
                return [JSON.parse(payload) as T]
            } catch {
                return []
            }
        })
    }

    private async ensureSyncTable(tableName: string) {
        if (this.ensuredTables.has(tableName)) {
            return
        }

        const keyspace = this.sanitizeIdentifier(envConfig().databases.scylladb.keyspace)
        const table = this.sanitizeIdentifier(tableName)

        await this.client.execute(
            `CREATE TABLE IF NOT EXISTS ${keyspace}.${table} (id text, locale text, payload text, updated_at timestamp, PRIMARY KEY (id, locale))`,
        )

        this.ensuredTables.add(tableName)
    }

    private sanitizeIdentifier(value: string) {
        const trimmed = value.trim()
        if (!/^[a-zA-Z_]\w*$/.test(trimmed)) {
            throw new InvalidScyllaIdentifierException({
                value,
            })
        }
        return trimmed
    }
}
