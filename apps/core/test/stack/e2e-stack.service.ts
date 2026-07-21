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
 * Where the stack's infra actually runs.
 * - "local" / "dockercloud": boot real Testcontainers (Docker Cloud only
 *   changes which Docker daemon they build against — the boot code here is
 *   identical, the daemon selection is Testcontainers' own `DOCKER_HOST` wiring).
 * - "vps": no containers are started; the stack targets an already-running
 *   VPS deployment instead.
 */
export type E2eStackProvider = "local" | "dockercloud" | "vps"

/**
 * Shared Testcontainers-backed infra stack used by BOTH the e2e lane
 * (`apps/core/test`) and the harness lane.
 *
 * Mirrors the boot sequence in {@link setup-e2e} — same image, same
 * `POSTGRESQL_PRIMARY_*` env vars — but packaged as an instance (rather than
 * Jest's globalSetup/globalTeardown pair) so a harness run can start/stop the
 * stack around a single flow.
 *
 * `provider === "vps"` short-circuits every method to a no-op / read-only
 * path: a VPS run points at a real deployment, and this class must never
 * start containers against it, seed fixtures into it, or tear it down.
 */
export class E2eStackService {
    /** The started Postgres container, once {@link up} has run for local/dockercloud. */
    public postgresContainer?: StartedPostgreSqlContainer

    /** Base URL of the stack under test — set from `VPS_BASE_URL` for "vps"; undefined for local/dockercloud (no HTTP server is booted by this stack). */
    public baseUrl?: string

    /**
     * Every container this instance has started, in start order, so
     * {@link down} can stop them in reverse without each caller having to
     * track its own handles.
     */
    private readonly startedContainers: Array<StartedTestContainer> = []

    /**
     * @param provider which environment the stack targets. Defaults to
     * "local" so existing e2e callers keep booting a throwaway container.
     */
    constructor(
        private readonly provider: E2eStackProvider = "local",
    ) {
    }

    /**
     * Boot the infra this stack owns.
     *
     * "local" / "dockercloud": start a throwaway `postgres:16-alpine`
     * container exactly like {@link setup-e2e} and wire the same
     * `POSTGRESQL_PRIMARY_*` env vars, so any code path that reads them
     * (e.g. `PrimaryPostgreSQLModule`) connects to the container transparently.
     *
     * "vps": start nothing — a VPS run targets an already-deployed
     * environment, read from `VPS_BASE_URL`.
     */
    public async up(): Promise<void> {
        if (this.provider === "vps") {
            this.baseUrl = process.env.VPS_BASE_URL
            return
        }

        // pin the same small, fast image setup-e2e uses; alpine keeps the pull/boot cheap
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
        // let TypeORM create every table/enum on connect — no migrations in tests
        process.env.POSTGRESQL_PRIMARY_SYNCHRONIZE = "true"

        // TODO: no flow needs Redis/NATS yet. When one does, call
        // `startGenericContainer("redis:7-alpine", [6379])` (or the NATS
        // image) from here and read the mapped port off the returned handle —
        // do NOT hand-roll a second container lifecycle helper.
    }

    /**
     * Per-flow fixture seeding hook — a documented no-op for now. Individual
     * e2e/harness flows still seed their own fixtures inline (see
     * `createE2eApp` callers); this is the future home for fixtures shared
     * across flows once one actually needs them.
     *
     * Always a no-op for "vps": a VPS run points at a real deployment and
     * this stack must never write fixture data into it.
     */
    public async seed(): Promise<void> {
        if (this.provider === "vps") {
            return
        }
        // TODO: add shared fixture seeding here once a consuming flow needs it.
    }

    /**
     * Stop every container this stack started, in reverse start order.
     *
     * Always a no-op for "vps": there is no local infra to tear down, and
     * this stack must never touch the real deployment it points at.
     */
    public async down(): Promise<void> {
        if (this.provider === "vps") {
            return
        }

        // stop in reverse so a later-started container (e.g. one that
        // depends on Postgres being up) is torn down before its dependency
        for (const container of [...this.startedContainers].reverse()) {
            await container.stop()
        }
        this.startedContainers.length = 0
    }

    /**
     * Start an ad-hoc infra container (Redis, NATS, …) and track it so
     * {@link down} stops it automatically.
     *
     * No default caller today — Postgres is the only infra every flow needs
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
