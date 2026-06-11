import {
    PostgreSqlContainer,
} from "@testcontainers/postgresql"
import type {
    StartedPostgreSqlContainer,
} from "@testcontainers/postgresql"

/**
 * Jest globalSetup: boot a throwaway PostgreSQL container and point the primary
 * datasource env vars at it. TypeORM `synchronize: true` then builds the whole
 * schema on first connection, so each e2e run starts from an empty, real DB.
 *
 * The started container is stashed on `globalThis` so {@link teardown-e2e}
 * can stop it after the suite (mirrors the "spin up infra → test → drop it all"
 * flow used by the lesson content harness).
 */
const setup = async (): Promise<void> => {
    // pin a small, fast Postgres image; alpine keeps the pull/boot cheap
    const container: StartedPostgreSqlContainer = await new PostgreSqlContainer(
        "postgres:16-alpine",
    ).start()

    // route the primary datasource (read in primary.module's useFactory) at it
    process.env.POSTGRESQL_PRIMARY_HOST = container.getHost()
    process.env.POSTGRESQL_PRIMARY_PORT = String(container.getPort())
    process.env.POSTGRESQL_PRIMARY_USERNAME = container.getUsername()
    process.env.POSTGRESQL_PRIMARY_PASSWORD = container.getPassword()
    process.env.POSTGRESQL_PRIMARY_DATABASE = container.getDatabase()
    // let TypeORM create every table/enum on connect — no migrations in tests
    process.env.POSTGRESQL_PRIMARY_SYNCHRONIZE = "true"

    // hand the container to globalTeardown (same process → globalThis persists)
    ;(globalThis as Record<string, unknown>).__PG_CONTAINER__ = container
}

export default setup
