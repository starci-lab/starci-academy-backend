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
            /** Transaction configuration. */
            transaction: {
                timeSinceCreationMs: parseEnvMs({
                    key: "API_TRANSACTION_TIME_SINCE_CREATION_MS",
                    defaultValue: "15m",
                }),
            },
            /** API port configuration. */
            port: parseEnvInt({
                key: "API_PORT",
                defaultValue: 3001,
            }),
            /** API pagination configuration. */
            pagination: {
                page: {
                    limit: parseEnvInt({
                        key: "API_PAGINATION_PAGE_LIMIT",
                        defaultValue: 20,
                    }),
                    pageNumber: parseEnvInt({
                        key: "API_PAGINATION_PAGE_NUMBER",
                        defaultValue: 1,
                    }),
                },
                cursor: {
                    limit: parseEnvInt({
                        key: "API_PAGINATION_CURSOR_LIMIT",
                        defaultValue: 20,
                    }),
                    cursor: parseEnvString({
                        key: "API_PAGINATION_CURSOR",
                        defaultValue: "",
                    }),
                },
            },
        },
        /** Github Worker service configuration. */
        githubWorker: {
            port: parseEnvInt({
                key: "GITHUB_WORKER_PORT",
                defaultValue: 3002,
            }),
            processGitUrl: {
                branch: parseEnvString({
                    key: "GITHUB_WORKER_PROCESS_GIT_URL_BRANCH",
                    defaultValue: "main",
                }),
                githubAccessToken: parseEnvString({
                    key: "GITHUB_WORKER_PROCESS_GIT_URL_GITHUB_ACCESS_TOKEN",
                    defaultValue: "",
                }),
                chunkSize: parseEnvInt({
                    key: "GITHUB_WORKER_PROCESS_GIT_URL_CHUNK_SIZE",
                    defaultValue: 1000,
                }),
                chunkOverlap: parseEnvInt({
                    key: "GITHUB_WORKER_PROCESS_GIT_URL_CHUNK_OVERLAP",
                    defaultValue: 200,
                }),
                collectionName: parseEnvString({
                    key: "GITHUB_WORKER_PROCESS_GIT_URL_COLLECTION_NAME",
                    defaultValue: "test-google-genai",
                }),
                embeddingModel: parseEnvString({
                    key: "GITHUB_WORKER_PROCESS_GIT_URL_EMBEDDING_MODEL",
                    defaultValue: "gemini-embedding-001",
                }),
                genAiApiKey: parseEnvString({
                    key: "GITHUB_WORKER_PROCESS_GIT_URL_GENAI_API_KEY",
                    defaultValue: "",
                }),
            },
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
    mountPath: {
        /** File paths: data courses. */
        data: {
            courses: parseEnvString({
                key: "DATA_COURSES_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "data",
                    "courses"),
            }),
        },
        /** File paths: app config. */
        config: {
            app: parseEnvString({
                key: "CONFIG_APP_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "config",
                    "app.json"),
            }),
            metadata: parseEnvString({
                key: "CONFIG_METADATA_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "config",
                    "metadata.json"),
            }),
        },
        /** File paths: terraform secrets. */
        terraform: {
            s3SecretAccessKey: parseEnvString({
                key: "TERRAFORM_S3_SECRET_ACCESS_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "terraform",
                    "s3-secret-access-key.key"),
            }),
            keycloakClientSecret: parseEnvString({
                key: "TERRAFORM_KEYCLOAK_CLIENT_SECRET_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "terraform",
                    "keycloak-client-secret.key"),
            }),
            payosApiKey: parseEnvString({
                key: "TERRAFORM_PAYOS_API_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "terraform",
                    "payos-api-key.key"),
            }),
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
                    defaultValue: "starci-academy",
                }),
                /**
                 * When true, TypeORM auto-creates/updates tables from entities on startup.
                 * Default: true in non-production (local dev); set POSTGRESQL_PRIMARY_SYNCHRONIZE=false to disable.
                 * Production should use migrations and keep this false.
                 */
                synchronize: parseEnvBoolean({
                    key: "POSTGRESQL_PRIMARY_SYNCHRONIZE",
                    defaultValue: parseEnvString({
                        key: "NODE_ENV",
                        defaultValue: "development",
                    }) !== "production",
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
        signedUrlExpiration: parseEnvMs({
            key: "S3_SIGNED_URL_EXPIRATION",
            defaultValue: "15m",
        }),
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

    /** Keycloak configuration. */
    keycloak: {
        url: parseEnvString({
            key: "KEYCLOAK_URL",
            defaultValue: "http://localhost:8089",
        }),
        realm: parseEnvString({
            key: "KEYCLOAK_REALM",
            defaultValue: "master",
        }),
        clientId: parseEnvString({
            key: "KEYCLOAK_CLIENT_ID",
            defaultValue: "academy-web",
        }),
        redirectUri: parseEnvString({
            key: "KEYCLOAK_REDIRECT_URI",
            defaultValue: "http://localhost:3001/api/v1/keycloak/google/callback",
        }),
    },
    /** Axios configuration. */
    axios: {
        retry: {
            maxRetries: parseEnvInt({
                key: "AXIOS_RETRY_MAX_RETRIES",
                defaultValue: 3,
            }),
            delay: parseEnvMs({
                key: "AXIOS_RETRY_DELAY",
                defaultValue: "1s",
            }),
        },
    },
    /** BullMQ configuration. */
    bullmq: {
        concurrency: parseEnvInt({
            key: "BULLMQ_CONCURRENCY",
            defaultValue: 1000,
        }),
        lockDuration: parseEnvMs({
            key: "BULLMQ_LOCK_DURATION",
            defaultValue: "10s",
        }),
        stalledInterval: parseEnvMs({
            key: "BULLMQ_STALLED_INTERVAL",
            defaultValue: "10s",
        }),
        maxStalledCount: parseEnvInt({
            key: "BULLMQ_MAX_STALLED_COUNT",
            defaultValue: 1,
        }),
        attempts: parseEnvInt({
            key: "BULLMQ_ATTEMPTS",
            defaultValue: 1,
        }),
        delay: parseEnvMs({
            key: "BULLMQ_DELAY",
            defaultValue: "1s",
        }),
    },
    /** Job tracking configuration. */
    job: {
        enroll: {
            maxSteps: parseEnvInt({
                key: "JOB_ENROLL_MAX_STEPS",
                defaultValue: 1,
            }),
        },
        stalled: parseEnvMs({
            key: "JOB_STALLED",
            defaultValue: "10m",
        }),
    },
    /** Apollo configuration. */
    apollo: {
        timeout: parseEnvMs({
            key: "APOLLO_TIMEOUT",
            defaultValue: "10s",
        }),
        retry: {
            initial: parseEnvMs({
                key: "APOLLO_RETRY_INITIAL",
                defaultValue: "1s",
            }),
            max: parseEnvMs({
                key: "APOLLO_RETRY_MAX",
                defaultValue: "10s",
            }),
            jitter: parseEnvBoolean({
                key: "APOLLO_RETRY_JITTER",
                defaultValue: true,
            }),
        },
    },
}
)
