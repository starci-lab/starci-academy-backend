import {
    PostgreSqlContainer,
} from "@testcontainers/postgresql"
import type {
    StartedPostgreSqlContainer,
} from "@testcontainers/postgresql"
import {
    GenericContainer,
    Wait,
} from "testcontainers"
import type {
    StartedTestContainer,
} from "testcontainers"
import {
    createServer,
} from "node:net"

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
    /** The shared Redis broker/cache container used by transport-level flows. */
    public redisContainer?: StartedTestContainer
    /** The shared NATS broker used by cross-instance event-routing flows. */
    public natsContainer?: StartedTestContainer
    /** The shared Qdrant instance used by vector-lifecycle operational flows. */
    public qdrantContainer?: StartedTestContainer
    /** Kafka-compatible broker used by production CDC consumers. */
    public kafkaContainer?: StartedTestContainer
    /** Search engine used by production indexing and GraphQL search flows. */
    public elasticsearchContainer?: StartedTestContainer
    /** S3-compatible object store used by storage/video operational flows. */
    public minioContainer?: StartedTestContainer

    /**
     * Every container this instance has started, in start order, so
     * {@link down} can stop them in reverse without each caller having to
     * track its own handles.
     */
    private readonly startedContainers: Array<StartedTestContainer> = []

    /**
     * Boot the infra this stack owns: throwaway Postgres, Redis and NATS
     * containers wired into the same env vars the application reads. This
     * keeps transport-level flows on production clients while sharing one
     * lifecycle across the serial E2E lane.
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

        const redisPassword = "starci-e2e-redis"
        this.redisContainer = await new GenericContainer("redis:7-alpine")
            .withCommand([
                "redis-server",
                "--requirepass",
                redisPassword,
            ])
            .withExposedPorts(6379)
            .start()
        this.startedContainers.push(this.redisContainer)
        process.env.REDIS_BULLMQ_HOST = this.redisContainer.getHost()
        process.env.REDIS_BULLMQ_PORT = String(this.redisContainer.getMappedPort(6379))
        process.env.REDIS_BULLMQ_USE_CLUSTER = "false"
        delete process.env.REDIS_BULLMQ_PASSWORD_FILE
        process.env.REDIS_BULLMQ_PASSWORD = redisPassword
        process.env.REDIS_CACHE_HOST = this.redisContainer.getHost()
        process.env.REDIS_CACHE_PORT = String(this.redisContainer.getMappedPort(6379))
        process.env.REDIS_CACHE_USE_CLUSTER = "false"
        delete process.env.REDIS_CACHE_PASSWORD_FILE
        process.env.REDIS_CACHE_PASSWORD = redisPassword

        if (process.env.E2E_STACK_PROFILE === "storage-video") {
            await this.startMinio()
            return
        }

        // Focused operational suites can opt into the smallest real stack they
        // need. The default remains the complete stack, so the canonical E2E
        // command still boots every shared production dependency. This profile
        // keeps a BullMQ-only regression from paying for Kafka/search/vector/S3.
        if (process.env.E2E_STACK_PROFILE === "core") {
            return
        }

        // Search transport tests need the production Elasticsearch client but
        // none of NATS, Kafka, Qdrant or MinIO. Keeping this profile explicit
        // prevents unrelated broker startup from consuming most of the suite's
        // timeout while preserving real Postgres, Redis and Elasticsearch I/O.
        if (process.env.E2E_STACK_PROFILE === "search") {
            await this.startElasticsearch()
            return
        }

        if (process.env.E2E_STACK_PROFILE === "qdrant") {
            await this.startQdrant()
            return
        }

        this.natsContainer = await this.startGenericContainer(
            "nats:2.10-alpine",
            [
                4222,
            ],
        )
        process.env.NATS_SERVERS_COUNT = "1"
        process.env.NATS_SERVER_1_HOST = this.natsContainer.getHost()
        process.env.NATS_SERVER_1_PORT = String(this.natsContainer.getMappedPort(4222))
        // The disposable broker is network-isolated by Testcontainers, so an
        // auth token adds no production fidelity and would only duplicate NATS
        // image configuration in the test harness.
        process.env.NATS_AUTH_ENABLED = "false"
        process.env.NATS_RECONNECT = "false"
        process.env.NATS_MAX_RECONNECT_ATTEMPTS = "0"
        // Keep a failed E2E consumer from retaining a timer after its app closes.
        process.env.NATS_CONSUMER_IDLE_TIMEOUT = "250ms"

        await this.startQdrant()

        // Redpanda speaks the Kafka protocol without needing ZooKeeper or a
        // second controller container. Binding a reserved host listener keeps
        // the advertised address identical to the address KafkaJS receives in
        // metadata; that is essential because Kafka clients reconnect to the
        // advertised broker after their bootstrap request.
        const kafkaHostPort = await this.reserveHostPort()
        this.kafkaContainer = await new GenericContainer(
            "redpandadata/redpanda:v24.3.18",
        )
            .withExposedPorts({
                container: 9092,
                host: kafkaHostPort,
            })
            .withCommand([
                "redpanda",
                "start",
                "--mode",
                "dev-container",
                "--smp",
                "1",
                "--memory",
                "512M",
                "--reserve-memory",
                "0M",
                "--node-id",
                "0",
                "--check=false",
                "--kafka-addr",
                "0.0.0.0:9092",
                "--advertise-kafka-addr",
                `localhost:${kafkaHostPort}`,
            ])
            .withWaitStrategy(Wait.forLogMessage(/Successfully started Redpanda/))
            .withStartupTimeout(120_000)
            .start()
        this.startedContainers.push(this.kafkaContainer)
        process.env.KAFKA_BROKERS = `localhost:${kafkaHostPort}`
        process.env.KAFKA_CDC_TOPIC_PREFIX = "starci-e2e.public."

        await this.startElasticsearch()

        await this.startMinio()
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
     * Redis and NATS use this path so any future broker follows the same
     * tracked lifecycle instead of hand-rolling container teardown in a spec.
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

    /** Start Elasticsearch and publish the production client configuration. */
    private async startElasticsearch(): Promise<void> {
        this.elasticsearchContainer = await new GenericContainer(
            "docker.elastic.co/elasticsearch/elasticsearch:8.19.1",
        )
            .withEnvironment({
                "discovery.type": "single-node",
                "xpack.security.enabled": "false",
                "ES_JAVA_OPTS": "-Xms512m -Xmx512m",
            })
            .withExposedPorts(9200)
            .withWaitStrategy(Wait.forHttp("/",
                9200)
                .forStatusCode(200))
            .withStartupTimeout(120_000)
            .start()
        this.startedContainers.push(this.elasticsearchContainer)
        process.env.ELASTICSEARCH_NODE = `http://${this.elasticsearchContainer.getHost()}:${this.elasticsearchContainer.getMappedPort(9200)}`
        // Security is disabled in the isolated Testcontainer. The production
        // client still owns the transport; empty credentials avoid introducing
        // a test-only Elasticsearch provider.
        process.env.ELASTICSEARCH_USERNAME = ""
        process.env.ELASTICSEARCH_PASSWORD = ""
    }

    /** Start Qdrant with the same explicit credential its production client reads. */
    private async startQdrant(): Promise<void> {
        const apiKey = "starci-e2e-qdrant"
        this.qdrantContainer = await new GenericContainer(
            "qdrant/qdrant:v1.15.1",
        )
            .withEnvironment({
                QDRANT__SERVICE__API_KEY: apiKey,
            })
            .withExposedPorts(6333)
            .start()
        this.startedContainers.push(this.qdrantContainer)
        process.env.QDRANT_URL = `http://${this.qdrantContainer.getHost()}:${this.qdrantContainer.getMappedPort(6333)}`
        delete process.env.QDRANT_API_KEY_FILE
        process.env.QDRANT_API_KEY = apiKey
    }

    /** Start the S3-compatible store and publish the production MinIO env. */
    private async startMinio(): Promise<void> {
        this.minioContainer = await new GenericContainer(
            "minio/minio:RELEASE.2025-04-22T22-12-26Z",
        )
            .withEnvironment({
                MINIO_ROOT_USER: "minioadmin",
                MINIO_ROOT_PASSWORD: "minioadmin123",
            })
            .withCommand([
                "server",
                "/data",
            ])
            .withExposedPorts(9000)
            .withWaitStrategy(Wait.forHttp("/minio/health/live",
                9000)
                .forStatusCode(200))
            .withStartupTimeout(120_000)
            .start()
        this.startedContainers.push(this.minioContainer)
        const endpoint = `http://${this.minioContainer.getHost()}:${this.minioContainer.getMappedPort(9000)}`
        process.env.S3_MINIO_ENDPOINT = endpoint
        process.env.S3_MINIO_PUBLIC_ENDPOINT = endpoint
        process.env.S3_MINIO_REGION = "us-east-1"
        process.env.S3_MINIO_ACCESS_KEY_ID = "minioadmin"
        process.env.S3_MINIO_SECRET_ACCESS_KEY = "minioadmin123"
        process.env.S3_MINIO_BUCKET = "starci-academy-e2e"
    }

    /** Ask the OS for an unused loopback port before a fixed Docker binding. */
    private async reserveHostPort(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const server = createServer()
            server.once("error",
                reject)
            server.listen(0,
                "127.0.0.1",
                () => {
                    const address = server.address()
                    if (!address || typeof address === "string") {
                        server.close()
                        reject(new Error("Could not reserve a Kafka host port"))
                        return
                    }
                    server.close((error) => {
                        if (error) {
                            reject(error)
                            return
                        }
                        resolve(address.port)
                    })
                })
        })
    }
}
