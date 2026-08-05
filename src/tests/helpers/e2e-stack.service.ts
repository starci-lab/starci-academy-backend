import {
    PostgreSqlContainer,
} from "@testcontainers/postgresql"
import type {
    StartedPostgreSqlContainer,
} from "@testcontainers/postgresql"
import {
    GenericContainer,
} from "testcontainers"
import type {
    StartedTestContainer,
} from "testcontainers"

/**
 * The Testcontainers-backed infra stack both test lanes boot: the e2e lane
 * (`src/tests/e2e`) and the harness lane (`src/tests/harness`).
 *
 * Deliberately a plain class rather than an `@Injectable()` provider. It is
 * constructed inside Jest's `globalSetup`, which runs in a DIFFERENT process
 * from the specs -- so a spec that injected it would get a second, empty
 * instance rather than the stack that is actually running. The handoff to
 * `globalTeardown` goes through `globalThis` for exactly that reason.
 */
export class E2eStackService {
    /** The started Postgres container, once {@link up} has run. */
    public postgresContainer?: StartedPostgreSqlContainer

    /**
     * Every container this instance has started, in start order, so
     * {@link down} can stop them in reverse without each caller having to
     * track its own handles.
     */
    private readonly startedContainers: Array<StartedTestContainer> = []

    /**
     * Boot the infra this stack owns: a throwaway `postgres:16-alpine`
     * container wired into the same `POSTGRESQL_PRIMARY_*` env vars the app
     * reads, so any code path that reads them (e.g. `PrimaryPostgreSQLModule`)
     * connects to the container transparently.
     */
    public async up(): Promise<void> {
        // pin a small, fast image; alpine keeps the pull/boot cheap
        this.postgresContainer = await new PostgreSqlContainer(
            "postgres:16-alpine",
        ).start()
        this.startedContainers.push(this.postgresContainer)

        // route the primary datasource (read in primary.module's useFactory) at it
        process.env.POSTGRESQL_PRIMARY_HOST = this.postgresContainer.getHost()
        process.env.POSTGRESQL_PRIMARY_PORT = String(this.postgresContainer.getPort())
        process.env.POSTGRESQL_PRIMARY_USERNAME = this.postgresContainer.getUsername()
        process.env.POSTGRESQL_PRIMARY_PASSWORD = this.postgresContainer.getPassword()
        process.env.POSTGRESQL_PRIMARY_DATABASE = this.postgresContainer.getDatabase()
        // let TypeORM create every table/enum on connect -- no migrations in tests
        process.env.POSTGRESQL_PRIMARY_SYNCHRONIZE = "true"

        // TODO: no flow needs Redis/NATS yet. When one does, call
        // `startGenericContainer("redis:7-alpine", [6379])` (or the NATS
        // image) from here and read the mapped port off the returned handle --
        // do NOT hand-roll a second container lifecycle helper.
    }

    /**
     * Per-flow fixture seeding hook -- a documented no-op for now. Individual
     * e2e/harness flows still seed their own fixtures inline (see
     * `createE2eApp` callers); this is the future home for fixtures shared
     * across flows once one actually needs them.
     */
    public async seed(): Promise<void> {
        // TODO: add shared fixture seeding here once a consuming flow needs it.
    }

    /** Stop every container this stack started, in reverse start order. */
    public async down(): Promise<void> {
        // stop in reverse so a later-started container (e.g. one that
        // depends on Postgres being up) is torn down before its dependency
        for (const container of [...this.startedContainers].reverse()) {
            await container.stop()
        }
        this.startedContainers.length = 0
    }

    /**
     * Start an ad-hoc infra container (Redis, NATS, ...) and track it so
     * {@link down} stops it automatically.
     *
     * No default caller today -- Postgres is the only infra every flow needs
     * (see the TODO in {@link up}). A future flow that requires more infra
     * calls this instead of hand-rolling its own container lifecycle.
     */
    protected async startGenericContainer(
        image: string,
        exposedPorts: Array<number>,
    ): Promise<StartedTestContainer> {
        const container = await new GenericContainer(image)
            .withExposedPorts(...exposedPorts)
            .start()
        this.startedContainers.push(container)
        return container
    }
}
