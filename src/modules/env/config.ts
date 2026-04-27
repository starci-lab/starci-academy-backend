import {
    join
} from "path"
import {
    parseEnvString,
    parseEnvInt,
    parseEnvBoolean,
    parseEnvFloat,
    parseEnvMs,
    parseEnvJson,
} from "./utils"
import {
    ContextType 
} from "./enums"

/**
 * Builds the application config from environment variables.
 * Each value is read via a parseEnv* helper (env var name + default).
 * Called at runtime; defaults apply when the corresponding env var is unset.
 */
export const envConfig = () => ({
    /** UUID namespace configuration. */
    uuidNamespace: {
        /** UUID namespace for course. */
        course: "d32d2da9-ad2e-44b4-b412-a97de455b8e4",
    },
    /** Cache configuration. */
    /** Cache: debug flags/TTL, key TTLs (withdraw, session, pool analytics, etc.), stale price max age. */
    cache: {
        debug: {
            enabled: parseEnvBoolean({
                key: "CACHE_DEBUG_ENABLED", defaultValue: true
            }),
            ttl: parseEnvMs({
                key: "CACHE_DEBUG_TTL", defaultValue: "5000"
            }),
            ok: {
                redis: parseEnvString({
                    key: "CACHE_DEBUG_OK_REDIS", defaultValue: "ok-redis"
                }),
                memory: parseEnvString({
                    key: "CACHE_DEBUG_OK_MEMORY", defaultValue: "ok-memory"
                }),
            },
        },
        ttl: {
            bloomFilter: parseEnvMs({
                key: "CACHE_TTL_BLOOM_FILTER",
                defaultValue: "100years"
            }),
            activePriceCex: parseEnvMs({
                key: "CACHE_TTL_ACTIVE_PRICE_CEX",
                defaultValue: "100years"
            }),
            activeVolumeCex: parseEnvMs({
                key: "CACHE_TTL_ACTIVE_VOLUME_CEX",
                defaultValue: "100years"
            }),
            cexTokenPriceUpdated: parseEnvMs({
                key: "CACHE_TTL_CEX_TOKEN_PRICE_UPDATED",
                defaultValue: "100years"
            }),
            cexTokenVolumeUpdated: parseEnvMs({
                key: "CACHE_TTL_CEX_TOKEN_VOLUME_UPDATED",
                defaultValue: "100years"
            }),
            rotationBotAssignments: parseEnvMs({
                key: "CACHE_TTL_ROTATION_BOT_ASSIGNMENTS",
                defaultValue: "100years"
            }),
            natsMessageDigest: parseEnvMs({
                key: "CACHE_TTL_NATS_MESSAGE_DIGEST",
                defaultValue: "3s",
            }),
            jobTrackByJobId: parseEnvMs({
                key: "CACHE_TTL_JOB_TRACK_BY_JOB_ID",
                defaultValue: "15m",
            }),
            jobSubscriberClientId: parseEnvMs({
                key: "CACHE_TTL_JOB_SUBSCRIBER_CLIENT_ID",
                defaultValue: "15m",
            }),
            parentIndex: parseEnvMs({
                key: "CACHE_TTL_PARENT_INDEX",
                defaultValue: "100years",
            }),
            withdraw: parseEnvMs({
                key: "CACHE_TTL_WITHDRAW",
                defaultValue: "30m"
            }),
            sendOtpCode: parseEnvMs({
                key: "CACHE_TTL_SEND_OTP_CODE",
                defaultValue: "10m"
            }),
            sessionId: parseEnvMs({
                key: "CACHE_TTL_SESSION_ID",
                defaultValue: "15m"
            }),
            aggregatedTokenPrice: parseEnvMs({
                key: "CACHE_TTL_AGGREGATED_TOKEN_PRICE",
                defaultValue: "100years"
            }),
            aggregatedTokenPriceTwap: parseEnvMs({
                key: "CACHE_TTL_AGGREGATED_TOKEN_PRICE_TWAP",
                defaultValue: "100years"
            }),
            dynamicClmmLiquidityPoolInfo: parseEnvMs({
                key: "CACHE_TTL_DYNAMIC_CLMM_LIQUIDITY_POOL_INFO",
                defaultValue: "100years"
            }),
            dynamicDlmmLiquidityPoolInfo: parseEnvMs({
                key: "CACHE_TTL_DYNAMIC_DLMM_LIQUIDITY_POOL_INFO",
                defaultValue: "100years"
            }),
            poolAnalytics: parseEnvMs({
                key: "CACHE_TTL_POOL_ANALYTICS",
                defaultValue: "100years"
            }),
            liquidityPoolsSyncedDiagnosticReadiness: parseEnvMs(
                {
                    key: "CACHE_TTL_LIQUIDITY_POOLS_SYNCED_DIAGNOSTIC_READINESS",
                    defaultValue: "100years"
                }
            ),
            violateIndicatorResults: parseEnvMs({
                key: "CACHE_TTL_VIOLATE_INDICATOR_RESULTS",
                defaultValue: "100years"
            }),
            closePositionSettlements: parseEnvMs({
                key: "CACHE_TTL_CLOSE_POSITION_SETTLEMENTS",
                defaultValue: "100years"
            }),
        },
        stale: {
            priceMaxAgeMs: parseEnvMs(
                {
                    key: "CACHE_STALE_PRICE_MAX_AGE_MS",
                    defaultValue: "10s"
                }
            ),
            rotationBotAssignmentsMaxAgeMs: parseEnvMs(
                {
                    key: "CACHE_STALE_ROTATION_BOT_ASSIGNMENTS_MAX_AGE_MS",
                    defaultValue: "10s"
                }
            ),
        },
    },
    /** True when NODE_ENV === "production". */
    isProduction: parseEnvString(
        {
            key: "NODE_ENV",
            defaultValue: "development",
        }
    ) === "production",
    /** Services configuration. */
    services: {
        core: {
            port: parseEnvInt({
                key: "CORE_PORT",
                defaultValue: 3001,
            }),
        },
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
            /** SePay configuration. */
            sepay: {
                bank: parseEnvString({
                    key: "API_SEPAY_BANK",
                    defaultValue: "MB",
                }),
                accountNumber: parseEnvString({
                    key: "API_SEPAY_ACCOUNT_NUMBER",
                    defaultValue: "0969998024",
                }),
            },
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
        /** Synchronizer service configuration. */
        synchronizer: {
            emailBloomFilter: {
                process: {
                    batchSize: parseEnvInt({
                        key: "SYNCHRONIZER_PROCESS_EMAIL_BLOOM_FILTER_BATCH_SIZE",
                        defaultValue: 1000,
                    }),
                },
            },
            elasticsearch: {
                challenge: {
                    interval: parseEnvMs({
                        key: "ELASTICSEARCH_SYNCHRONIZER_CHALLENGE_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                content: {
                    interval: parseEnvMs({
                        key: "ELASTICSEARCH_SYNCHRONIZER_CONTENT_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                course: {
                    interval: parseEnvMs({
                        key: "ELASTICSEARCH_SYNCHRONIZER_COURSE_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                lessonVideo: {
                    interval: parseEnvMs({
                        key: "ELASTICSEARCH_SYNCHRONIZER_LESSON_VIDEO_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                module: {
                    interval: parseEnvMs({
                        key: "ELASTICSEARCH_SYNCHRONIZER_MODULE_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
            },
            cdn: {
                course: {
                    interval: parseEnvMs({
                        key: "CDN_SYNCHRONIZER_COURSE_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                challenge: {
                    interval: parseEnvMs({
                        key: "CDN_SYNCHRONIZER_CHALLENGE_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                lessonVideo: {
                    interval: parseEnvMs({
                        key: "CDN_SYNCHRONIZER_LESSON_VIDEO_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                module: {
                    interval: parseEnvMs({
                        key: "CDN_SYNCHRONIZER_MODULE_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                content: {
                    interval: parseEnvMs({
                        key: "CDN_SYNCHRONIZER_CONTENT_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
            },
            indexer: {
                challenge: {
                    interval: parseEnvMs({
                        key: "INDEXER_SYNCHRONIZER_CHALLENGE_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                content: {
                    interval: parseEnvMs({
                        key: "INDEXER_SYNCHRONIZER_CONTENT_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                lessonVideo: {
                    interval: parseEnvMs({
                        key: "INDEXER_SYNCHRONIZER_LESSON_VIDEO_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                module: {
                    interval: parseEnvMs({
                        key: "INDEXER_SYNCHRONIZER_MODULE_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                course: {
                    interval: parseEnvMs({
                        key: "INDEXER_SYNCHRONIZER_COURSE_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
            },
        },
        /** Brevo SMTP relay configuration. */
        brevo: {
            host: parseEnvString({
                key: "BREVO_SMTP_HOST",
                defaultValue: "smtp-relay.brevo.com",
            }),
            port: parseEnvInt({
                key: "BREVO_SMTP_PORT",
                defaultValue: 587,
            }),
            secure: parseEnvBoolean({
                key: "BREVO_SMTP_SECURE",
                defaultValue: false,
            }),
            username: parseEnvString({
                key: "BREVO_SMTP_USERNAME",
                defaultValue: "991795001@smtp-brevo.com",
            }),
            /** Default sender email address. */
            fromAddress: parseEnvString({
                key: "BREVO_FROM_ADDRESS",
                defaultValue: "noreply@starci.academy.org",
            }),
            /** Default sender display name. */
            fromName: parseEnvString({
                key: "BREVO_FROM_NAME",
                defaultValue: "Starci Academy",
            }),
        },
        /** GitHub Organization service configuration. */
        github: {
            organization: parseEnvString({
                key: "GITHUB_ORGANIZATION",
                defaultValue: "test-academy-org",
            }),
            teamSlugsByCourseSlug: parseEnvJson<Record<string, string>>({
                key: "GITHUB_TEAM_SLUGS_BY_COURSE_SLUG",
                defaultValue: JSON.stringify({
                    "fullstack-mastery": "fullstack-mastery",
                    "system-design-mastery": "system-design-mastery",
                }),
            }),
        },
        /** Github Worker service configuration. */
        githubWorker: {
            port: parseEnvInt({
                key: "GITHUB_WORKER_PORT",
                defaultValue: 3002,
            }),
            processGitSubmission: {
                branch: parseEnvString({
                    key: "GITHUB_WORKER_PROCESS_GIT_SUBMISSION_BRANCH",
                    defaultValue: "main",
                }),
                chunkSize: parseEnvInt({
                    key: "GITHUB_WORKER_PROCESS_GIT_SUBMISSION_CHUNK_SIZE",
                    defaultValue: 1000,
                }),
                chunkOverlap: parseEnvInt({
                    key: "GITHUB_WORKER_PROCESS_GIT_SUBMISSION_CHUNK_OVERLAP",
                    defaultValue: 200,
                }),
                gradingMaxSourceChars: parseEnvInt({
                    key: "GITHUB_WORKER_PROCESS_GIT_SUBMISSION_GRADING_MAX_SOURCE_CHARS",
                    defaultValue: 120000,
                }),
                embedding: {
                    model: parseEnvString({
                        key: "GITHUB_WORKER_PROCESS_GIT_SUBMISSION_EMBEDDING_MODEL",
                        defaultValue: "text-embedding-3-small",
                    }),
                    provider: parseEnvString({
                        key: "GITHUB_WORKER_PROCESS_GIT_SUBMISSION_EMBEDDING_MODEL_PROVIDER",
                        defaultValue: "openai",
                    }),
                },
                grading: {
                    model: parseEnvString({
                        key: "GITHUB_WORKER_PROCESS_GIT_SUBMISSION_GRADING_MODEL",
                        defaultValue: "gpt-4o-mini",
                    }),
                    provider: parseEnvString({
                        key: "GITHUB_WORKER_PROCESS_GIT_SUBMISSION_GRADING_MODEL_PROVIDER",
                        defaultValue: "openai",
                    }),
                },
            },
        },
        /** Cdn Synchronizer service configuration. */
        cdnSynchronizer: {
            course: {
                interval: parseEnvMs({
                    key: "CDN_SYNCHRONIZER_COURSE_SYNC_INTERVAL_MS",
                    defaultValue: "30s",
                }),
            },
            challenge: {
                interval: parseEnvMs({
                    key: "CDN_SYNCHRONIZER_CHALLENGE_SYNC_INTERVAL_MS",
                    defaultValue: "30s",
                }),     
            },
            lessonVideo: {
                interval: parseEnvMs({
                    key: "CDN_SYNCHRONIZER_LESSON_VIDEO_SYNC_INTERVAL_MS",
                    defaultValue: "30s",
                }),
            },
            module: {
                interval: parseEnvMs({
                    key: "CDN_SYNCHRONIZER_MODULE_SYNC_INTERVAL_MS",
                    defaultValue: "30s",
                }),
            },
            content: {
                interval: parseEnvMs({
                    key: "CDN_SYNCHRONIZER_CONTENT_SYNC_INTERVAL_MS",
                    defaultValue: "30s",
                }),
            },
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
        /** Elasticsearch Synchronizer service configuration. */
        elasticsearchSynchronizer: {
            challenge: {
                interval: parseEnvMs({
                    key: "ELASTICSEARCH_SYNCHRONIZER_CHALLENGE_SYNC_INTERVAL_MS",
                    defaultValue: "30s",
                }),
            },
            content: {
                interval: parseEnvMs({
                    key: "ELASTICSEARCH_SYNCHRONIZER_CONTENT_SYNC_INTERVAL_MS",
                    defaultValue: "30s",
                }),
            },
            course: {
                interval: parseEnvMs({  
                    key: "ELASTICSEARCH_SYNCHRONIZER_COURSE_SYNC_INTERVAL_MS",
                    defaultValue: "30s",
                }),
            },
            lessonVideo: {
                interval: parseEnvMs({
                    key: "ELASTICSEARCH_SYNCHRONIZER_LESSON_VIDEO_SYNC_INTERVAL_MS",
                    defaultValue: "30s",
                }),
            },
            module: {
                interval: parseEnvMs({
                    key: "ELASTICSEARCH_SYNCHRONIZER_MODULE_SYNC_INTERVAL_MS",
                    defaultValue: "30s",
                }),
            },
        },
        /** ScyllaDB Synchronizer service configuration. */
        scylladbSynchronizer: {
            syncIntervalMs: {
                courses: {
                    factory: parseEnvMs({
                        key: "SCYLLADB_SYNCHRONIZER_COURSES_FACTORY_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                    runtime: parseEnvMs({
                        key: "SCYLLADB_SYNCHRONIZER_COURSES_RUNTIME_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                lessonVideos: {
                    factory: parseEnvMs({
                        key: "SCYLLADB_SYNCHRONIZER_LESSON_VIDEOS_FACTORY_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                    runtime: parseEnvMs({
                        key: "SCYLLADB_SYNCHRONIZER_LESSON_VIDEOS_RUNTIME_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                challenges: {
                    factory: parseEnvMs({
                        key: "SCYLLADB_SYNCHRONIZER_CHALLENGES_FACTORY_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                    runtime: parseEnvMs({
                        key: "SCYLLADB_SYNCHRONIZER_CHALLENGES_RUNTIME_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                },
                contents: {
                    factory: parseEnvMs({
                        key: "SCYLLADB_SYNCHRONIZER_CONTENTS_FACTORY_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
                    }),
                    runtime: parseEnvMs({
                        key: "SCYLLADB_SYNCHRONIZER_CONTENTS_RUNTIME_SYNC_INTERVAL_MS",
                        defaultValue: "30s",
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
    /** Context configuration. */
    contexts: [
        /** S3 context. */
        {
            index: 0,
            priority: parseEnvInt({
                key: "CONTEXT_0_PRIORITY",
                defaultValue: 0,
            }),
            type: ContextType.S3,
            enabled: parseEnvBoolean({
                key: "CONTEXT_0_ENABLED",
                defaultValue: false,
            }),
            path: parseEnvString({
                key: "CONTEXT_0_PATH",
                defaultValue: "https://starci-academy-resources.sfo3.cdn.digitaloceanspaces.com/courses",
            }),
            provider: "digitalOcean",
        },
        /** Filesystem context. */
        {
            priority: 1,
            index: 1,
            type: ContextType.Filesystem,
            enabled: parseEnvBoolean({
                key: "CONTEXT_1_ENABLED",
                defaultValue: true,
            }),
            path: parseEnvString({
                key: "CONTEXT_1_URL",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "data",
                    "courses"
                ),
            }),
        },
    ],
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
            githubAccessToken: parseEnvString({
                key: "TERRAFORM_GITHUB_ACCESS_TOKEN_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "terraform",
                    "github-access-token.key"),
            }),
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
            geminiApiKey: parseEnvString({
                key: "TERRAFORM_GEMINI_API_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "terraform",
                    "gemini-api-key.key"),
            }),
            openAiApiKey: parseEnvString({
                key: "TERRAFORM_OPENAI_API_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "terraform",
                    "openai-api-key.key"),
            }),
            sepayApiKey: parseEnvString({
                key: "TERRAFORM_SEPAY_API_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "terraform",
                    "sepay-api-key.key"),
            }),
            brevoSmtpPassword: parseEnvString({
                key: "TERRAFORM_BREVO_SMTP_PASSWORD_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "terraform",
                    "brevo-smtp-api-key.key"),
            }),
            gcpServiceAccountJson: parseEnvString({
                key: "TERRAFORM_GCP_SERVICE_ACCOUNT_JSON_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".mount",
                    "terraform",
                    "gcp-service-account.json"),
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
                defaultValue: "http://localhost:3000"
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
        /** ScyllaDB configuration. */
        scylladb: {
            contactPoints: parseEnvString({
                key: "SCYLLADB_CONTACT_POINTS",
                defaultValue: "localhost",
            })
                .split(",")
                .map((host) => host.trim())
                .filter((host) => host !== ""),
            port: parseEnvInt({
                key: "SCYLLADB_PORT",
                defaultValue: 9042,
            }),
            keyspace: parseEnvString({
                key: "SCYLLADB_KEYSPACE",
                defaultValue: "starci",
            }),
            localDataCenter: parseEnvString({
                key: "SCYLLADB_LOCAL_DATACENTER",
                defaultValue: "datacenter1",
            }),
            username: parseEnvString({
                key: "SCYLLADB_USERNAME",
                defaultValue: "scylla",
            }),
            password: parseEnvString({
                key: "SCYLLADB_PASSWORD",
                defaultValue: "Cuong123_A",
            }),
        },
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
                    defaultValue: true,
                }),
            },
            /** Keycloak PostgreSQL configuration. */
            keycloak: {
                host: parseEnvString({
                    key: "POSTGRESQL_KEYCLOAK_HOST",
                    defaultValue: "localhost",
                }),
                port: parseEnvInt({
                    key: "POSTGRESQL_KEYCLOAK_PORT",
                    defaultValue: 5432,
                }),
                username: parseEnvString({
                    key: "POSTGRESQL_KEYCLOAK_USERNAME",
                    defaultValue: "postgres",
                }),
                password: parseEnvString({
                    key: "POSTGRESQL_KEYCLOAK_PASSWORD",
                    defaultValue: "Cuong123_A",
                }),
                database: parseEnvString({
                    key: "POSTGRESQL_KEYCLOAK_DATABASE",
                    defaultValue: "keycloak",
                }),
            },
        },
    },
    /** Backup configuration. */
    backup: {
        encrypt: {
            /**
             * Password used to encrypt backup artifacts (e.g. openssl enc).
             * Prefer providing via environment variable in production.
             */
            password: parseEnvString({
                key: "BACKUP_ENCRYPT_PASSWORD",
                defaultValue: "",
            }),
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
        /** AWS S3 configuration. */
        digitalOcean: {
            endpoint: parseEnvString({
                key: "S3_ENDPOINT",
                defaultValue: "https://sfo3.digitaloceanspaces.com",
            }),
            region: parseEnvString({
                key: "S3_REGION",
                defaultValue: "sfo3",
            }),
            accessKeyId: parseEnvString({
                key: "S3_ACCESS_KEY_ID",
                defaultValue: "",
            }),
            bucket: parseEnvString({
                key: "S3_BUCKET",
                defaultValue: "starci-academy-resources",
            }),
            presignedUrl: {
                expiration: parseEnvMs({
                    key: "S3_PRESIGNED_URL_EXPIRATION",
                    defaultValue: "15m",
                }),
            },
        },
        /** MinIO configuration. */
        minio: {
            endpoint: parseEnvString({
                key: "S3_MINIO_ENDPOINT",
                defaultValue: "http://localhost:9000",
            }),
            region: parseEnvString({
                key: "S3_MINIO_REGION",
                defaultValue: "us-east-1",
            }),
            accessKeyId: parseEnvString({
                key: "S3_MINIO_ACCESS_KEY_ID",
                defaultValue: "minioadmin",
            }),
            secretAccessKey: parseEnvString({
                key: "S3_MINIO_SECRET_ACCESS_KEY",
                defaultValue: "minioadmin123",
            }),
            bucket: parseEnvString({
                key: "S3_MINIO_BUCKET",
                defaultValue: "starci-academy",
            }),
            presignedUrl: {
                expiration: parseEnvMs({
                    key: "S3_MINIO_PRESIGNED_URL_EXPIRATION",
                    defaultValue: "15m",
                }),
            },
        },
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
        admin: {
            clientId: parseEnvString({
                key: "KEYCLOAK_ADMIN_CLIENT_ID",
                defaultValue: "admin-cli",
            }),
            username: parseEnvString({
                key: "KEYCLOAK_ADMIN_USERNAME",
                defaultValue: "admin",
            }),
            password: parseEnvString({
                key: "KEYCLOAK_ADMIN_PASSWORD",
                defaultValue: "bitnami123",
            }),
        },
        redirectUri: {
            google: parseEnvString({
                key: "KEYCLOAK_GOOGLE_REDIRECT_URI",
                defaultValue: "http://localhost:3001/api/v1/keycloak/google/callback",
            }),
            github: parseEnvString({
                key: "KEYCLOAK_GITHUB_REDIRECT_URI",
                defaultValue: "http://localhost:3001/api/v1/keycloak/github/callback",
            }),
        },
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
        /** Enroll job configuration. */
        enroll: {
            maxSteps: parseEnvInt({
                key: "JOB_ENROLL_MAX_STEPS",
                defaultValue: 1,
            }),
        },
        /** Process CV Submission job configuration. */
        processCvSubmission: {
            maxSteps: parseEnvInt({
                key: "JOB_PROCESS.CV_SUBMISSION_MAX_STEPS",
                defaultValue: 2,
            }),
        },
        /** Process Git Submission job configuration. */
        processGitSubmission: {
            maxSteps: parseEnvInt({
                key: "JOB_PROCESS_GIT_SUBMISSION_MAX_STEPS",
                defaultValue: 2,
            }),
            cooldownMs: parseEnvMs({
                key: "CHALLENGE_SUBMISSION_COOLDOWN_MS",
                defaultValue: "2h",
            }),
        },
        /** Send Mail job configuration. */
        sendMail: {
            maxSteps: parseEnvInt({
                key: "JOB_SEND_MAIL_MAX_STEPS",
                defaultValue: 1,
            }),
        },
        /** Job stalled configuration. */
        stalled: {
            thresholdMs: parseEnvMs({
                key: "JOB_STALLED_RETRY_THRESHOLD_MS",
                defaultValue: "10s",
            }),
            intervalMs: parseEnvMs({
                key: "JOB_STALLED_INTERVAL_MS",
                defaultValue: "5s",
            }),
        },
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
    /** Elasticsearch configuration. */
    elasticsearch: {
        node: parseEnvString({
            key: "ELASTICSEARCH_NODE",
            defaultValue: "http://localhost:9200",
        }),
        username: parseEnvString({
            key: "ELASTICSEARCH_USERNAME",
            defaultValue: "elastic",
        }),
        password: parseEnvString({
            key: "ELASTICSEARCH_PASSWORD",
            defaultValue: "123456",
        }),
    },
    /** NATS configuration. */
    nats: {
        servers: Array.from({
            length: parseEnvInt({
                key: "NATS_SERVERS_COUNT", defaultValue: 1
            })
        },
        (_, i) => ({
            host: parseEnvString({
                key: `NATS_SERVER_${i + 1}_HOST`,
                defaultValue: "localhost"
            }),
            port: parseEnvInt({
                key: `NATS_SERVER_${i + 1}_PORT`,
                defaultValue: 4222
            }),
        })),
        reconnect: parseEnvBoolean({
            key: "NATS_RECONNECT", defaultValue: true
        }),
        maxReconnectAttempts: parseEnvInt({
            key: "NATS_MAX_RECONNECT_ATTEMPTS", defaultValue: 10
        }),
        pingIntervalMs: parseEnvInt({
            key: "NATS_PING_INTERVAL_MS", defaultValue: 120000
        }),
        consumer: {
            idleTimeout: parseEnvMs({
                key: "NATS_CONSUMER_IDLE_TIMEOUT", defaultValue: "3m"
            }),
        },
        ping: {
            interval: parseEnvMs({
                key: "NATS_PING_INTERVAL", defaultValue: "10s"
            }),
        },
        auth: {
            enabled: parseEnvBoolean({
                key: "NATS_AUTH_ENABLED", defaultValue: true
            }),
            token: parseEnvString({
                key: "NATS_AUTH_TOKEN", defaultValue: "starci@2026"
            }),
        }
    },
    readPolicy: {
        sources: [
            {
                priority: parseEnvInt({
                    key: "READ_POLICY_ELASTICSEARCH_PRIORITY",
                    defaultValue: 1,
                }),
                type: "elasticsearch",
                maxRetries: parseEnvInt({
                    key: "READ_POLICY_ELASTICSEARCH_MAX_RETRIES",
                    defaultValue: 3,
                }),
                enabled: parseEnvBoolean({
                    key: "READ_POLICY_ELASTICSEARCH_ENABLED",
                    defaultValue: true,
                }),
                retryDelayMs: parseEnvMs({
                    key: "READ_POLICY_ELASTICSEARCH_RETRY_DELAY_MS",
                    defaultValue: "1s",
                }),
                timeoutMs: {
                    min: parseEnvMs({
                        key: "READ_POLICY_ELASTICSEARCH_TIMEOUT_MS_MIN",
                        defaultValue: "1s",
                    }),
                    max: parseEnvMs({
                        key: "READ_POLICY_ELASTICSEARCH_TIMEOUT_MS_MAX",
                        defaultValue: "10s",
                    }),
                }
            },
            {
                priority: parseEnvInt({
                    key: "READ_POLICY_CASSANDRA_PRIORITY",
                    defaultValue: 2,
                }),
                type: "cassandra",
                maxRetries: parseEnvInt({
                    key: "READ_POLICY_CASSANDRA_MAX_RETRIES",
                    defaultValue: 3,
                }),
                enabled: parseEnvBoolean({
                    key: "READ_POLICY_CASSANDRA_ENABLED",
                    defaultValue: false,
                }),
                retryDelayMs: parseEnvMs({
                    key: "READ_POLICY_CASSANDRA_RETRY_DELAY_MS",
                    defaultValue: "1s",
                }),
                timeoutMs: {
                    min: parseEnvMs({
                        key: "READ_POLICY_CASSANDRA_TIMEOUT_MS_MIN",
                        defaultValue: "1s",
                    }),
                    max: parseEnvMs({
                        key: "READ_POLICY_CASSANDRA_TIMEOUT_MS_MAX",
                        defaultValue: "10s",
                    }),
                }
            },
            {
                priority: 3,
                type: "scylladb",
                maxRetries: parseEnvInt({
                    key: "READ_POLICY_SCYLLA_MAX_RETRIES",
                    defaultValue: 3,
                }),
                enabled: parseEnvBoolean({
                    key: "READ_POLICY_SCYLLA_ENABLED",
                    defaultValue: false,
                }),
                retryDelayMs: parseEnvMs({
                    key: "READ_POLICY_SCYLLA_RETRY_DELAY_MS",
                    defaultValue: "1s",
                }),
                timeoutMs: {
                    min: parseEnvMs({
                        key: "READ_POLICY_SCYLLA_TIMEOUT_MS_MIN",
                        defaultValue: "1s",
                    }),
                    max: parseEnvMs({
                        key: "READ_POLICY_SCYLLA_TIMEOUT_MS_MAX",
                        defaultValue: "10s",
                    }),
                }
            },
            {
                priority: 4,
                type: "mongodb",
                maxRetries: parseEnvInt({
                    key: "READ_POLICY_MONGODB_MAX_RETRIES",
                    defaultValue: 3,
                }),
                enabled: parseEnvBoolean({
                    key: "READ_POLICY_MONGODB_ENABLED",
                    defaultValue: true,
                }),
                retryDelayMs: parseEnvMs({
                    key: "READ_POLICY_MONGODB_RETRY_DELAY_MS",
                    defaultValue: "1s",
                }),
                timeoutMs: {
                    min: parseEnvMs({
                        key: "READ_POLICY_MONGODB_TIMEOUT_MS_MIN",
                        defaultValue: "1s",
                    }),
                    max: parseEnvMs({
                        key: "READ_POLICY_MONGODB_TIMEOUT_MS_MAX",
                        defaultValue: "10s",
                    }),
                }
            },
            {
                priority: 5,
                type: "postgresql",
                maxRetries: parseEnvInt({
                    key: "READ_POLICY_POSTGRESQL_MAX_RETRIES",
                    defaultValue: 3,
                }),
                enabled: parseEnvBoolean({
                    key: "READ_POLICY_POSTGRESQL_ENABLED",
                    defaultValue: true,
                }),
                retryDelayMs: parseEnvMs({
                    key: "READ_POLICY_POSTGRESQL_RETRY_DELAY_MS",
                    defaultValue: "1s",
                }),
                timeoutMs: {
                    min: parseEnvMs({
                        key: "READ_POLICY_POSTGRESQL_TIMEOUT_MS_MIN",
                        defaultValue: "1s",
                    }),
                    max: parseEnvMs({
                        key: "READ_POLICY_POSTGRESQL_TIMEOUT_MS_MAX",
                        defaultValue: "10s",
                    }),
                }
            }
        ]
    }
}
)
