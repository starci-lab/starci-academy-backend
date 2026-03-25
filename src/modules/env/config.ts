import {
    join
} from "path"
import {
    parseEnvString,
    parseEnvInt,
    parseEnvBoolean,
    parseEnvFloat,
    parseEnvMs,
} from "./utils/parse-env"

/**
 * Builds the application config from environment variables.
 * Each value is read via a parseEnv* helper (env var name + default).
 * Called at runtime; defaults apply when the corresponding env var is unset.
 */
export const envConfig = () => ({
    /** True when NODE_ENV === "production". */
    isProduction: parseEnvString(
        {
            key: "NODE_ENV",
            defaultValue: "development",
        }
    ) === "production",
    /** Services configuration. */
    services: {
        /** API service configuration. */
        api: {
            port: parseEnvInt({
                key: "API_PORT",
                defaultValue: 3001,
            }),
        },
        /** Github Worker service configuration. */
        githubWorker: {
            port: parseEnvInt({
                key: "GITHUB_WORKER_PORT",
                defaultValue: 3002,
            }),
        },
        /** Cdn Synchronizer service configuration. */
        cdnSynchronizer: {
            syncIntervalMs: {
                courses: parseEnvMs({
                    key: "CDN_SYNCHRONIZER_COURSES_SYNC_INTERVAL_MS",
                    defaultValue: "10s",
                }),
            },
            retries: {
                courses: {
                    maxRetries: parseEnvInt({
                        key: "CDN_SYNCHRONIZER_COURSES_SYNC_MAX_RETRIES",
                        defaultValue: 3,
                    }),
                    retryDelayMs: parseEnvMs({
                        key: "CDN_SYNCHRONIZER_COURSES_SYNC_RETRY_DELAY_MS",
                        defaultValue: "5s",
                    }),
                },
            },
        },
    },
    /** Loki configuration. */
    loki: {
        /** The host of the Loki instance. */
        host: parseEnvString({
            key: "LOKI_HOST",
            defaultValue: "http://localhost:3100",
        }),
        /** Whether to require authentication to the Loki instance. */
        requireAuth: parseEnvBoolean({
            key: "LOKI_REQUIRE_AUTH",
            defaultValue: false,
        }),
        /** The username to use to authenticate to the Loki instance. */
        username: parseEnvString({
            key: "LOKI_USERNAME",
            defaultValue: "admin",
        }),
        /** The password to use to authenticate to the Loki instance. */
        password: parseEnvString({
            key: "LOKI_PASSWORD",
            defaultValue: "admin",
        }),
    },
    /** Redis configuration. */
    redis: {
        /** BullMQ Redis configuration. */
        bullmq: {
            host: parseEnvString({
                key: "REDIS_BULLMQ_HOST",
                defaultValue: "localhost",
            }),
            port: parseEnvInt({
                key: "REDIS_BULLMQ_PORT",
                defaultValue: 6379,
            }),
            password: parseEnvString({
                key: "REDIS_BULLMQ_PASSWORD",
                defaultValue: "Cuong123_A",
            }),
            useCluster: parseEnvBoolean({
                key: "REDIS_BULLMQ_USE_CLUSTER",
                defaultValue: false,
            }),
        },
        /** Throttler Redis configuration. */
        throttler: {
            host: parseEnvString({
                key: "REDIS_THROTTLER_HOST",
                defaultValue: "localhost",
            }),
            port: parseEnvInt({
                key: "REDIS_THROTTLER_PORT",
                defaultValue: 6379,
            }),
            password: parseEnvString({
                key: "REDIS_THROTTLER_PASSWORD",
                defaultValue: "Cuong123_A",
            }),
            useCluster: parseEnvBoolean({
                key: "REDIS_THROTTLER_USE_CLUSTER",
                defaultValue: false,
            }),
        },
        /** Adapter Redis configuration. */
        adapter: {
            host: parseEnvString({
                key: "REDIS_ADAPTER_HOST",
                defaultValue: "localhost",
            }),
            port: parseEnvInt({
                key: "REDIS_ADAPTER_PORT",
                defaultValue: 6379,
            }),
            password: parseEnvString({
                key: "REDIS_ADAPTER_PASSWORD",
                defaultValue: "Cuong123_A",
            }),
            useCluster: parseEnvBoolean({
                key: "REDIS_ADAPTER_USE_CLUSTER",
                defaultValue: false,
            }),
        },
        /** Cache Redis configuration. */
        cache: {
            host: parseEnvString({
                key: "REDIS_CACHE_HOST",
                defaultValue: "localhost",
            }),
            port: parseEnvInt({
                key: "REDIS_CACHE_PORT",
                defaultValue: 6379,
            }),
            password: parseEnvString({
                key: "REDIS_CACHE_PASSWORD",
                defaultValue: "Cuong123_A",
            }),
            useCluster: parseEnvBoolean({
                key: "REDIS_CACHE_USE_CLUSTER",
                defaultValue: false,
            }),
        },
    },
    /** Wait configuration. */
    wait: {
        base: {
            retries: parseEnvInt({
                key: "WAIT_BASE_RETRIES",
                defaultValue: 10,
            }),
            intervalMs: parseEnvInt({
                key: "WAIT_BASE_INTERVAL_MS",
                defaultValue: 1000,
            }),
        },
    },
    /** Mount path configuration. */
    /** File paths: app config. */
    mountPath: {
        config: {
            app: parseEnvString({
                key: "CONFIG_APP_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "config",
                    "app.json"),
            })
        },
    },
    /** CORS: allowed origins (CORS_ORIGIN_1 … CORS_ORIGIN_10, empty skipped). */
    cors: {
        origins: Array.from({
            length: 10
        },
        (_, i) =>
            parseEnvString({
                key: `CORS_ORIGIN_${i + 1}`,
                defaultValue: ""
            }),
        ).filter((url) => url !== "")
    },
    /** Kubernetes configuration. */
    k8s: {
        global: {
            podName: parseEnvString({
                key: "K8S_POD_NAME",
                defaultValue: "",
            }),
            namespace: parseEnvString({
                key: "K8S_NAMESPACE",
                defaultValue: "",
            }),
        },
    },
    /** Retry configuration. */
    retry: {
        base: {
            retries: parseEnvInt({
                key: "RETRY_BASE_RETRIES",
                defaultValue: 10,
            }),
            factor: parseEnvFloat({
                key: "RETRY_BASE_FACTOR",
                defaultValue: 1.5,
            }),
            minTimeout: parseEnvInt({
                key: "RETRY_BASE_MIN_TIMEOUT",
                defaultValue: 1000,
            }),
            maxTimeout: parseEnvInt({
                key: "RETRY_BASE_MAX_TIMEOUT",
                defaultValue: 10000,
            }),
            randomize: parseEnvBoolean({
                key: "RETRY_BASE_RANDOMIZE",
                defaultValue: true,
            }),
        },
    },
    /** Databases configuration. */
    databases: {
        /** Qdrant configuration. */
        qdrant: {
            url: parseEnvString({
                key: "QDRANT_URL",
                defaultValue: "http://localhost:6333",
            }),
            apiKey: parseEnvString({
                key: "QDRANT_API_KEY",
                defaultValue: "Cuong123_A",
            }),
        },
        /** PostgreSQL configuration. */
        postgresql: {
            /** Primary PostgreSQL configuration. */
            primary: {
                host: parseEnvString({
                    key: "POSTGRESQL_PRIMARY_HOST",
                    defaultValue: "localhost",
                }),
                port: parseEnvInt({
                    key: "POSTGRESQL_PRIMARY_PORT",
                    defaultValue: 5432,
                }),
                username: parseEnvString({
                    key: "POSTGRESQL_PRIMARY_USERNAME",
                    defaultValue: "postgres",
                }),
                password: parseEnvString({
                    key: "POSTGRESQL_PRIMARY_PASSWORD",
                    defaultValue: "Cuong123_A",
                }),
                database: parseEnvString({
                    key: "POSTGRESQL_PRIMARY_DATABASE",
                    defaultValue: "postgres",
                }),
            },
        },
    },
    /** Computation configuration. */
    computation: {
        round: {
            fractionDigits: parseEnvInt({
                key: "COMPUTATION_ROUND_FRACTION_DIGITS",
                defaultValue: 2,
            }),
        },
        operation: {
            fractionDigits: parseEnvInt({
                key: "COMPUTATION_OPERATION_FRACTION_DIGITS",
                defaultValue: 2,
            }),
        },
        amount: {
            fractionDigits: parseEnvInt({
                key: "COMPUTATION_AMOUNT_FRACTION_DIGITS",
                defaultValue: 2,
            }),
        },
    },
    /** S3 configuration. */
    s3: {
        endpoint: parseEnvString({
            key: "S3_ENDPOINT",
            defaultValue: "https://sgp1.digitaloceanspaces.com",
        }),
        region: parseEnvString({
            key: "S3_REGION",
            defaultValue: "",
        }),
        accessKeyId: parseEnvString({
            key: "S3_ACCESS_KEY_ID",
            defaultValue: "",
        }),
        secretAccessKey: parseEnvString({
            key: "S3_SECRET_ACCESS_KEY",
            defaultValue: "",
        }),
        bucket: parseEnvString({
            key: "S3_BUCKET",
            defaultValue: "starci-academy",
        }),
    },
}
)
