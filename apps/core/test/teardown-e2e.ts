import type {
    StartedPostgreSqlContainer,
} from "@testcontainers/postgresql"

/**
 * Jest globalTeardown: stop and remove the PostgreSQL container started in
 * {@link setup-e2e}. Leaves no infra behind once the e2e suite finishes.
 */
const teardown = async (): Promise<void> => {
    // recover the container handle stashed by globalSetup
    const container = (globalThis as Record<string, unknown>)
        .__PG_CONTAINER__ as StartedPostgreSqlContainer | undefined

    // stop it so the throwaway database (and its data) is dropped entirely
    if (container) {
        await container.stop()
    }
}

export default teardown
