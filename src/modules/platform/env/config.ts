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
    parseEnvSecond,
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
    /** CV configuration. */
    cv: {
        maxCharsPlan: parseEnvInt({
            key: "CV_MAX_CHARS_PLAN",
            defaultValue: 10000,
        }),
    },
    /** Community (feed + chat) configuration. */
    community: {
        /** Max community posts a NON-member may create within the rolling window. */
        nonMemberPostLimit: parseEnvInt({
            key: "COMMUNITY_NON_MEMBER_POST_LIMIT",
            defaultValue: 3,
        }),
        /** Rolling window (in days) the non-member post limit is measured over. */
        nonMemberPostWindowDays: parseEnvInt({
            key: "COMMUNITY_NON_MEMBER_POST_WINDOW_DAYS",
            defaultValue: 7,
        }),
        /** Username of the founder (drives the founder badge + founder-only actions). */
        founderUsername: parseEnvString({
            key: "COMMUNITY_FOUNDER_USERNAME",
            defaultValue: "starci183",
        }),
    },
    /** UUID namespace configuration. */
    uuidNamespace: {
        /** UUID namespace for course. */
        course: "d32d2da9-ad2e-44b4-b412-a97de455b8e4",
        /** UUID namespace for template CV. */
        templateCV: "d32d2da9-ad2e-44b4-b412-a97de455b8e4",
        /** UUID namespace for foundation. */
        foundation: "d32d2da9-ad2e-44b4-b412-a97de455b8e4",
        /** UUID namespace for headhunter mount data. */
        headhunting: "d32d2da9-ad2e-44b4-b412-a97de455b8e4",
        /** UUID namespace for coding-practice problems (deterministic ids from slug). */
        codingProblem: "d32d2da9-ad2e-44b4-b412-a97de455b8e4",
    },
    /** Cache configuration. */
    /** Cache: debug flags/TTL, key TTLs (withdraw, session, pool analytics, etc.), stale price max age. */
    cache: {
        debug: {
            enabled: parseEnvBoolean({
                key: "CACHE_DEBUG_ENABLED", defaultValue: false
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
            keycloakOidcPkce: parseEnvMs({
                key: "CACHE_TTL_KEYCLOAK_OIDC_PKCE",
                defaultValue: "15m",
            }),
            keycloakUser: parseEnvMs({
                key: "CACHE_TTL_KEYCLOAK_USER",
                defaultValue: "100years",
            }),
            userEnrolledCourses: parseEnvMs({
                key: "CACHE_TTL_USER_ENROLLED_COURSES",
                // del-on-write (enroll/refund) is the primary correctness path;
                // this TTL is a safety net that self-heals any missed invalidation
                defaultValue: "1h",
            }),
            userProfileLocked: parseEnvMs({
                key: "CACHE_TTL_USER_PROFILE_LOCKED",
                // del-on-write (updateProfile) is the primary correctness path;
                // this TTL is a safety net that self-heals any missed invalidation
                defaultValue: "1h",
            }),
            courseMindMap: parseEnvMs({
                key: "CACHE_TTL_COURSE_MIND_MAP",
                defaultValue: "1h",
            }),
            enrollmentMilestones: parseEnvMs({
                key: "CACHE_TTL_ENROLLMENT_MILESTONES",
                defaultValue: "15m",
            }),
            milestoneTaskProgress: parseEnvMs({
                key: "CACHE_TTL_MILESTONE_TASK_PROGRESS",
                defaultValue: "100years",
            }),
            challengeSubmissionProgress: parseEnvMs({
                key: "CACHE_TTL_CHALLENGE_SUBMISSION_PROGRESS",
                defaultValue: "5m",
            }),
            codingProblemProgress: parseEnvMs({
                key: "CACHE_TTL_CODING_PROBLEM_PROGRESS",
                defaultValue: "5m",
            }),
            creditUsage: parseEnvMs({
                key: "CACHE_TTL_CREDIT_USAGE",
                defaultValue: "5m",
            }),
            aiPingKeyStatus: parseEnvMs({
                key: "CACHE_TTL_AI_PING_KEY_STATUS",
                defaultValue: "100years",
            }),
            aiModelLatency: parseEnvMs({
                key: "CACHE_TTL_AI_MODEL_LATENCY",
                // effectively infinite — the probe scheduler keeps it fresh by
                // overwriting every cycle, so the TTL only matters as a backstop
                defaultValue: "100years",
            }),
            entityLabel: parseEnvMs({
                key: "CACHE_TTL_ENTITY_LABEL",
                // labels (titles/usernames) change rarely; a day keeps feeds cheap, edits self-heal on expiry
                defaultValue: "1d",
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
    /** Public-facing web app (SPA) configuration. */
    web: {
        /**
         * Base URL of the learner-facing web app. Used to build absolute links
         * inside transactional emails (e.g. "Get started", "View dashboard").
         * No trailing slash.
         */
        baseUrl: parseEnvString({
            key: "WEB_BASE_URL",
            defaultValue: "https://academy.starci.org",
        }),
    },
    /** Services configuration. */
    services: {
        core: {
            port: parseEnvInt({
                key: "CORE_PORT",
                defaultValue: 3001,
            }),
        },
        /** Standalone mock-sandbox service (public dummy API for lesson Sandpack iframes). */
        mock: {
            port: parseEnvInt({
                key: "MOCK_PORT",
                defaultValue: 3002,
            }),
            /** Artificial response delay (ms) so lesson sandboxes show loading/skeleton states. */
            delayMs: parseEnvInt({
                key: "MOCK_DELAY_MS",
                defaultValue: 1000,
            }),
        },
        /**
         * Standalone local-only ops "tools" service (the `apps/tools` app).
         * Serves the Vite ops dashboard at `/dashboard` and exposes
         * `/api/v1/tools/*` endpoints for managing cloud infra from a local
         * machine (media→MinIO, Postgres snapshot/backup, S3 bucket snapshot).
         * Hard-blocked (404) when `isProduction` is true.
         */
        tools: {
            /** HTTP port the local ops console listens on. */
            port: parseEnvInt({
                key: "TOOLS_PORT",
                defaultValue: 3003,
            }),
        },
        /** API service configuration. */
        api: {
            enable: parseEnvBoolean({
                key: "API_ENABLE",
                defaultValue: true,
            }),
            /**
             * Dev-only artificial response latency so the frontend can exercise its
             * loading / skeleton states (real APIs are never instant). FORCED OFF in
             * production. OFF by default — enable per-environment with
             * `API_RESPONSE_DELAY_ENABLE=true`; tune the latency with
             * `API_RESPONSE_DELAY_MS` (default 5000ms).
             */
            responseDelay: {
                enable: parseEnvBoolean({
                    key: "API_RESPONSE_DELAY_ENABLE",
                    defaultValue: false,
                }),
                ms: parseEnvInt({
                    key: "API_RESPONSE_DELAY_MS",
                    defaultValue: 5000,
                }),
            },
            /** Transaction configuration. */
            transaction: {
                timeSinceCreationMs: parseEnvMs({
                    key: "API_TRANSACTION_TIME_SINCE_CREATION_MS",
                    defaultValue: "15m",
                }),
                /** Reconciliation poll for pending transactions with no webhook. */
                reconcile: {
                    /**
                     * Master switch for the reconcile poll. When false the
                     * delayed poll is never scheduled, so a pending transaction
                     * is finalized ONLY by its gateway webhook — used to test the
                     * webhook path in isolation before trusting the poller.
                     */
                    enabled: parseEnvBoolean({
                        key: "API_TRANSACTION_RECONCILE_ENABLED",
                        defaultValue: true,
                    }),
                    /** Delay before each poll and between polls (first poll fires after this). */
                    delayMs: parseEnvMs({
                        key: "API_TRANSACTION_RECONCILE_DELAY_MS",
                        defaultValue: "1m",
                    }),
                    /** Max number of polls before the transaction is marked unpaid. */
                    maxAttempts: parseEnvInt({
                        key: "API_TRANSACTION_RECONCILE_MAX_ATTEMPTS",
                        defaultValue: 5,
                    }),
                },
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
                /** SePay Payment Gateway environment ("sandbox" | "production"). */
                env: parseEnvString({
                    key: "API_SEPAY_ENV",
                    defaultValue: "sandbox",
                }),
                /** SePay Payment Gateway merchant id (secret key comes from mount). */
                merchantId: parseEnvString({
                    key: "API_SEPAY_MERCHANT_ID",
                    defaultValue: "SP-TEST-CNA92625",
                }),
            },
            /**
             * Stripe (international card gateway) configuration.
             * Secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) are NOT env vars —
             * they live in mount-terraform files read via {@link MountFilesystemService}.
             */
            stripe: {
                /** ISO currency Stripe Checkout charges in (lowercase per Stripe API). */
                currency: parseEnvString({
                    key: "STRIPE_CURRENCY",
                    defaultValue: "usd",
                }),
            },
            /**
             * PayPal (international gateway) configuration.
             * Secrets (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID) are NOT
             * env vars — they live in mount-terraform files read via {@link MountFilesystemService}.
             */
            paypal: {
                /** REST API base URL (sandbox by default; live = api-m.paypal.com). */
                baseUrl: parseEnvString({
                    key: "PAYPAL_BASE_URL",
                    defaultValue: "https://api-m.sandbox.paypal.com",
                }),
                /** ISO currency PayPal orders are created in (uppercase per PayPal API). */
                currency: parseEnvString({
                    key: "PAYPAL_CURRENCY",
                    defaultValue: "USD",
                }),
            },
            /**
             * NOWPayments (crypto gateway — USDT/USDC) configuration.
             * Secrets (NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET) are NOT env vars —
             * they live in mount-terraform files read via {@link MountFilesystemService}.
             */
            nowpayments: {
                /** REST API base URL (sandbox by default). */
                baseUrl: parseEnvString({
                    key: "NOWPAYMENTS_BASE_URL",
                    defaultValue: "https://api.sandbox.nowpayments.io/v1",
                }),
                /** Fiat currency the invoice price is quoted in. */
                priceCurrency: parseEnvString({
                    key: "NOWPAYMENTS_PRICE_CURRENCY",
                    defaultValue: "usd",
                }),
                /** Crypto asset the customer pays in (e.g. `usdttrc20`, `usdcerc20`). */
                payCurrency: parseEnvString({
                    key: "NOWPAYMENTS_PAY_CURRENCY",
                    defaultValue: "usdttrc20",
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
            enable: parseEnvBoolean({
                key: "SYNCHRONIZER_ENABLE",
                defaultValue: true,
            }),
            /**
             * After each sync, delete Elasticsearch docs + CDN objects whose entity
             * no longer exists in PostgreSQL (ghosts from removed/renumbered content).
             */
            pruneOrphans: parseEnvBoolean({
                key: "SYNCHRONIZER_PRUNE_ORPHANS",
                defaultValue: true,
            }),
            /**
             * Safety cap: skip pruning an entity type (with a loud warn) when more
             * than this fraction of its ES/CDN entries would be deleted — guards
             * against wiping everything if the DB came back empty (seed hiccup).
             */
            pruneMaxRatio: parseEnvFloat({
                key: "SYNCHRONIZER_PRUNE_MAX_RATIO",
                defaultValue: 0.5,
            }),
            emailBloomFilter: {
                interval: parseEnvMs({
                    key: "SYNCHRONIZER_PROCESS_EMAIL_BLOOM_FILTER_INTERVAL_MS",
                    defaultValue: "30s",
                }),
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
                defaultValue: "aca71c001@smtp-brevo.com",
            }),
            /** Default sender email address. */
            fromAddress: parseEnvString({
                key: "BREVO_FROM_ADDRESS",
                defaultValue: "quannam27042004@gmail.com",
            }),
            /** Default sender display name. */
            fromName: parseEnvString({
                key: "BREVO_FROM_NAME",
                defaultValue: "Quan Nguyen",
            }),
        },
        /** GitHub Organization service configuration. */
        github: {
            organization: parseEnvString({
                key: "GITHUB_ORGANIZATION",
                defaultValue: "StarCi-Academy",
            }),
            teamSlugsByCourseSlug: parseEnvJson<Record<string, string>>({
                key: "GITHUB_TEAM_SLUGS_BY_COURSE_SLUG",
                defaultValue: JSON.stringify({
                    "fullstack-mastery": "fullstack-mastery",
                    "system-design-mastery": "system-design-mastery",
                    "devops-mastery": "devops-mastery",
                    "ai-llm-engineering": "ai-llm-engineering",
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
                gradingPerCriterionTopK: parseEnvInt({
                    key: "GITHUB_WORKER_PROCESS_GIT_SUBMISSION_GRADING_PER_CRITERION_TOP_K",
                    defaultValue: 6,
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
        /**
         * Content RAG index — builds a persistent Qdrant collection over every
         * lesson's body (+ sandbox code) at init so content-AI chat can retrieve
         * the most relevant chunks instead of stuffing the whole body.
         */
        contentRag: {
            /**
             * Build the lesson RAG index on init. Default OFF: embedding every
             * lesson hits the embedding lane (local GPU first, cloud fallback)
             * and adds boot time on every reseed — enable explicitly when the
             * RAG retrieval path is wanted.
             */
            enabled: parseEnvBoolean({
                key: "CONTENT_RAG_INDEX_ENABLED",
                defaultValue: false,
            }),
            /** Qdrant collection holding the lesson RAG vectors. */
            collection: parseEnvString({
                key: "CONTENT_RAG_COLLECTION",
                defaultValue: "content_rag",
            }),
            /** Chunk size (chars) for splitting lesson body / code before embedding. */
            chunkSize: parseEnvInt({
                key: "CONTENT_RAG_CHUNK_SIZE",
                defaultValue: 1000,
            }),
            /** Chunk overlap (chars) between adjacent chunks. */
            chunkOverlap: parseEnvInt({
                key: "CONTENT_RAG_CHUNK_OVERLAP",
                defaultValue: 200,
            }),
            /** Top-k chunks retrieved per content-AI question. */
            retrievalTopK: parseEnvInt({
                key: "CONTENT_RAG_RETRIEVAL_TOP_K",
                defaultValue: 6,
            }),
            /**
             * Char ceiling under which a lesson body is stuffed WHOLE into the
             * content-AI prompt (cheap, no retrieval miss). Above it, the chat
             * falls back to RAG retrieval over the persistent collection.
             */
            stuffCharThreshold: parseEnvInt({
                key: "CONTENT_RAG_STUFF_CHAR_THRESHOLD",
                defaultValue: 6000,
            }),
            /**
             * Per-kind toggles for the "search course content" expansion — each
             * corpus is a separate (slow) MinIO/Postgres enumeration + embed pass,
             * so a kind can be disabled independently while iterating without
             * re-embedding the other three. All default true when `enabled` above
             * is true; this only narrows further.
             */
            indexChallenges: parseEnvBoolean({
                key: "CONTENT_RAG_INDEX_CHALLENGES_ENABLED",
                defaultValue: true,
            }),
            indexFlashcards: parseEnvBoolean({
                key: "CONTENT_RAG_INDEX_FLASHCARDS_ENABLED",
                defaultValue: true,
            }),
            indexMilestoneTasks: parseEnvBoolean({
                key: "CONTENT_RAG_INDEX_MILESTONE_TASKS_ENABLED",
                defaultValue: true,
            }),
            indexFoundations: parseEnvBoolean({
                key: "CONTENT_RAG_INDEX_FOUNDATIONS_ENABLED",
                defaultValue: true,
            }),
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
    /**
     * Judge0 (self-hosted code-execution sandbox) configuration.
     * The X-Auth-Token secret is NOT an env var — it lives in a mount-terraform
     * file read via {@link MountFilesystemService} (see `mountPath.terraform.judge0AuthToken`).
     */
    judge0: {
        /** Base URL of the Judge0 REST API (the self-hosted compose stack). */
        baseUrl: parseEnvString({
            key: "JUDGE0_BASE_URL",
            defaultValue: "http://localhost:2358",
        }),
        /** Delay between batch-result polls while a submission is judging. */
        pollIntervalMs: parseEnvMs({
            key: "JUDGE0_POLL_INTERVAL_MS",
            defaultValue: "600ms",
        }),
        /** Max number of poll attempts before giving up (poll interval × this = timeout). */
        maxPollAttempts: parseEnvInt({
            key: "JUDGE0_MAX_POLL_ATTEMPTS",
            defaultValue: 100,
        }),
        /**
         * Hard wall-clock cap for judging one submission end-to-end. If Judge0
         * hasn't returned terminal results for every testcase within this budget,
         * the batch is abandoned and the submission is marked failed (TLE).
         */
        overallTimeoutMs: parseEnvMs({
            key: "JUDGE0_OVERALL_TIMEOUT_MS",
            defaultValue: "10s",
        }),
        /** HTTP request timeout for a single Judge0 call. */
        requestTimeoutMs: parseEnvMs({
            key: "JUDGE0_REQUEST_TIMEOUT_MS",
            defaultValue: "15s",
        }),
        /**
         * Map of {@link CodingLanguage} string value → Judge0 numeric `language_id`.
         * Defaults are the Judge0 CE stable ids; override per Judge0 version.
         */
        languageIds: parseEnvJson<Record<string, number>>({
            key: "JUDGE0_LANGUAGE_IDS",
            defaultValue: JSON.stringify({
                python: 71,
                javascript: 63,
                typescript: 74,
                java: 62,
                cpp: 54,
            }),
        }),
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
                    ".contexts",
                ),
            }),
        },
    ],
    /** Data-git — the private GitHub repo holding seed content (courses, coding problems, rules). */
    dataGit: {
        /** Repository owner (GitHub org or user). The seed-content `data` repo was
         * transferred to the `starci-lab` org (the module/code repos stay under
         * `GITHUB_ORGANIZATION`). GitHub redirects the old StarCi-Academy/data URL. */
        owner: parseEnvString({
            key: "DATA_GIT_OWNER",
            defaultValue: "starci-lab",
        }),
        /** Repository name. */
        repo: parseEnvString({
            key: "DATA_GIT_REPO",
            defaultValue: "data",
        }),
        /** Git ref (branch) to fetch; empty string means the repo default branch. */
        ref: parseEnvString({
            key: "DATA_GIT_REF",
            defaultValue: "",
        }),
        /** Sub-directory inside the repo whose contents map to the data root; empty means the repo root. */
        subdir: parseEnvString({
            key: "DATA_GIT_SUBDIR",
            defaultValue: "",
        }),
    },
    /** Mount path configuration. */
    mountPath: {
        /** File paths: data courses. */
        data: {
            courses: parseEnvString({
                key: "DATA_COURSES_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".contexts",
                    "courses"),
            }),
            codingProblems: parseEnvString({
                key: "DATA_CODING_PROBLEMS_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".contexts",
                    "coding-problems"),
            }),
            advertisements: parseEnvString({
                key: "DATA_ADVERTISEMENTS_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "data",
                    "advertisements"),
            }),
            changelog: parseEnvString({
                key: "DATA_CHANGELOG_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "data",
                    "changelog"),
            }),
            achievements: parseEnvString({
                key: "DATA_ACHIEVEMENTS_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "data",
                    "achievements"),
            }),
            mockInterviewEq: parseEnvString({
                key: "DATA_MOCK_INTERVIEW_EQ_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "data",
                    "mock-interview-eq"),
            }),
        },
        /** File paths: app config. */
        config: {
            app: parseEnvString({
                key: "CONFIG_APP_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "config",
                    "app.yaml"),
            }),
            metadata: parseEnvString({
                key: "CONFIG_METADATA_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "config",
                    "metadata.json"),
            }),
            initScope: parseEnvString({
                key: "CONFIG_INIT_SCOPE_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "config",
                    "seed.yaml"),
            }),
        },
        /** File paths: terraform secrets. */
        terraform: {
            keycloakAdmin: parseEnvString({
                key: "TERRAFORM_KEYCLOAK_ADMIN_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "keycloak-admin.json"
                ),
            }),
            githubAccessToken: parseEnvString({
                key: "TERRAFORM_GITHUB_ACCESS_TOKEN_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "github-access-token.key"),
            }),
            dataGitToken: parseEnvString({
                key: "TERRAFORM_DATA_GIT_TOKEN_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "data-git-token.key"),
            }),
            githubSecretKey: parseEnvString({
                key: "TERRAFORM_GITHUB_SECRET_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "github-secret-key.key"),
            }),
            s3SecretAccessKey: parseEnvString({
                key: "TERRAFORM_S3_SECRET_ACCESS_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "s3-secret-access-key.key"),
            }),
            keycloakClientSecret: parseEnvString({
                key: "TERRAFORM_KEYCLOAK_CLIENT_SECRET_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "keycloak-client-secret.key"),
            }),
            payosApiKey: parseEnvString({
                key: "TERRAFORM_PAYOS_API_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "payos-api-key.key"),
            }),
            sepayApiKey: parseEnvString({
                key: "TERRAFORM_SEPAY_API_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "sepay-api-key.key"),
            }),
            stripeSecretKey: parseEnvString({
                key: "TERRAFORM_STRIPE_SECRET_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "stripe-secret-key.key"),
            }),
            stripeWebhookSecret: parseEnvString({
                key: "TERRAFORM_STRIPE_WEBHOOK_SECRET_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "stripe-webhook-secret.key"),
            }),
            paypalClientId: parseEnvString({
                key: "TERRAFORM_PAYPAL_CLIENT_ID_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "paypal-client-id.key"),
            }),
            paypalClientSecret: parseEnvString({
                key: "TERRAFORM_PAYPAL_CLIENT_SECRET_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "paypal-client-secret.key"),
            }),
            paypalWebhookId: parseEnvString({
                key: "TERRAFORM_PAYPAL_WEBHOOK_ID_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "paypal-webhook-id.key"),
            }),
            nowpaymentsApiKey: parseEnvString({
                key: "TERRAFORM_NOWPAYMENTS_API_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "nowpayments-api-key.key"),
            }),
            nowpaymentsIpnSecret: parseEnvString({
                key: "TERRAFORM_NOWPAYMENTS_IPN_SECRET_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "nowpayments-ipn-secret.key"),
            }),
            brevoSmtpPassword: parseEnvString({
                key: "TERRAFORM_BREVO_SMTP_PASSWORD_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "brevo-smtp-api-key.key"),
            }),
            encryptionKey: parseEnvString({
                key: "TERRAFORM_ENCRYPTION_KEY_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "encryption-key.key"),
            }),
            judge0AuthToken: parseEnvString({
                key: "TERRAFORM_JUDGE0_AUTH_TOKEN_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "judge0-auth-token.key"),
            }),
            gcpServiceAccountJson: parseEnvString({
                key: "TERRAFORM_GCP_SERVICE_ACCOUNT_JSON_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "gcp-service-account.json"),
            }),
        },
        /**
         * File paths: rotating API-key pools consumed by the AI Balancer feature.
         * Each file is newline-separated — one key per line; blank lines and
         * `#`-comment lines are stripped (see `parseApiKeysFile`).
         */
        aiKeys: {
            /**
             * Directory holding the per-provider key pool files. A model's
             * `keysFilePath` may be a BARE filename (e.g. `openai-api-keys.key`),
             * understood to live here; a value containing a path separator is
             * used verbatim instead.
             */
            dir: parseEnvString({
                key: "AI_KEYS_DIR_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "keys"),
            }),
            openai: parseEnvString({
                key: "AI_KEYS_OPENAI_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "keys",
                    "openai-api-keys.key"),
            }),
            gemini: parseEnvString({
                key: "AI_KEYS_GEMINI_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "keys",
                    "gemini-api-keys.key"),
            }),
            /**
             * Bearer token sent (as `Authorization: Bearer …`) to the self-hosted
             * `local` provider behind its Caddy gate. File missing/empty → the
             * key-store falls back to a placeholder, fine for a direct local
             * Ollama with no auth gate.
             */
            local: parseEnvString({
                key: "AI_KEYS_LOCAL_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "keys",
                    "qwen7b.key"),
            }),
            /**
             * API-key pool sent to OpenRouter (`Authorization: Bearer …`).
             * One key per line; missing/empty → empty pool (no crash).
             */
            openrouter: parseEnvString({
                key: "AI_KEYS_OPENROUTER_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "keys",
                    "openrouter-api-keys.key"),
            }),
            /**
             * Native Anthropic API-key pool (frontier tier — Claude Opus).
             * One key per line; missing/empty → empty pool (no crash).
             */
            anthropic: parseEnvString({
                key: "AI_KEYS_ANTHROPIC_MOUNT_PATH",
                defaultValue: join(process.cwd(),
                    ".volume",
                    "terraform",
                    "keys",
                    "anthropic-api-keys.key"),
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
    /** Cookie configuration shared across cookie-driven auth flows. */
    cookie: {
        /**
         * Domain scope for the JS-readable CSRF cookie. Set to the parent
         * domain (e.g. ".academy.starci.org") so the SPA on the apex/sibling
         * host can read the token that `api.<...>` issued. Empty = host-only
         * (local dev), which keeps the cookie scoped to the issuing host.
         */
        domain: parseEnvString(
            {
                key: "COOKIE_DOMAIN",
                defaultValue: ""
            }
        ),
    },
    /** CSRF protection configuration (double-submit token signing). */
    csrf: {
        /** HMAC secret used to sign CSRF tokens. MUST be overridden in production. */
        secret: parseEnvString(
            {
                key: "CSRF_SECRET",
                defaultValue: "dev-insecure-csrf-secret-change-me"
            }
        ),
    },
    /** Multi-device session enforcement configuration. */
    session: {
        /** Lifetime of a Redis session record; matches the refresh-cookie window. */
        ttlMs: parseEnvMs(
            {
                key: "SESSION_TTL",
                defaultValue: "30d"
            }
        ),
        /**
         * Maximum number of devices that may stay logged in concurrently per
         * account. On the (maxDevices + 1)-th login the oldest session is evicted.
         */
        maxDevices: parseEnvInt(
            {
                key: "SESSION_MAX_DEVICES",
                defaultValue: 2
            }
        ),
    },
    /** Cloudflare Turnstile captcha configuration. */
    captcha: {
        /** When false the captcha guard is a pass-through (local dev/test). */
        enabled: parseEnvBoolean(
            {
                key: "CAPTCHA_ENABLED",
                defaultValue: false
            }
        ),
        /** Cloudflare Turnstile secret key used for server-side siteverify. */
        turnstileSecret: parseEnvString(
            {
                key: "TURNSTILE_SECRET",
                defaultValue: ""
            }
        ),
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
            /**
             * Per-request HTTP timeout (ms) for the Qdrant REST client. The
             * `@qdrant/js-client-rest` default is 300000 (5 min), which a
             * first-time bulk upsert of a large corpus (e.g. the lesson RAG
             * index, thousands of chunks in one `fromDocuments` call) can
             * exceed — the client aborts with a generic "operation was
             * aborted" error even though Qdrant itself is still healthy.
             */
            timeoutMs: parseEnvInt({
                key: "QDRANT_TIMEOUT_MS",
                defaultValue: 900_000,
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
    /**
     * Local-only ops "tools" console configuration (the `apps/tools` app).
     * These artifacts are written to the local filesystem so the operator can
     * inspect/sync them by hand — they never leave the machine unless a sync
     * tool pushes them.
     */
    tools: {
        /**
         * Root directory where Postgres dumps and S3 bucket snapshots are
         * written. Lives under the repo working dir by default and is
         * git-ignored; override per machine with `TOOLS_SNAPSHOT_DIR`.
         */
        snapshotDir: parseEnvString({
            key: "TOOLS_SNAPSHOT_DIR",
            defaultValue: join(process.cwd(),
                ".tools-snapshots"),
        }),
        /**
         * Path to the local SQLite database that stores saved S3 targets and
         * the artifact registry (so artifacts can be listed and re-synced
         * without recomputing). Defaults under the snapshot root; override with
         * `TOOLS_DB_PATH`.
         */
        dbPath: parseEnvString({
            key: "TOOLS_DB_PATH",
            defaultValue: join(process.cwd(),
                ".tools-snapshots",
                "tools.sqlite"),
        }),
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
            /**
             * Optional public base URL for presigned GET/PUT and `buildPublicObjectUrl`.
             * Use when the app talks to Spaces over a private/internal endpoint but browsers must use a CDN or public hostname.
             */
            publicEndpoint: parseEnvString({
                key: "S3_PUBLIC_ENDPOINT",
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
            /**
             * Optional public base URL for presigned URLs (e.g. reverse proxy / tunnel).
             * When empty, presign uses `S3_MINIO_ENDPOINT` (same as internal SDK traffic).
             */
            publicEndpoint: parseEnvString({
                key: "S3_MINIO_PUBLIC_ENDPOINT",
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
            presignTtl: parseEnvSecond({
                key: "S3_MINIO_PRESIGNED_URL_EXPIRATION",
                defaultValue: "15m",
            }),
        },
    },

    /** Static brand assets synced from a local folder to S3/MinIO on boot. */
    assets: {
        // host-mounted folder (relative to cwd) holding the source asset files;
        // lives under `.mount` so deploys bind-mount it in like config/terraform
        dir: parseEnvString({
            key: "ASSETS_DIR",
            defaultValue: join(process.cwd(),
                ".volume",
                "assets"),
        }),
    },

    /** Prometheus configuration (cAdvisor-scraped container resource metrics). */
    prometheus: {
        /** Prometheus HTTP API base URL — reached from the host, not from inside Docker. */
        url: parseEnvString({
            key: "PROMETHEUS_URL",
            defaultValue: "http://localhost:9090",
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
    /** GitHub configuration. */
    github: {
        oauth: {
            redirectUri: parseEnvString({
                key: "GITHUB_OAUTH_REDIRECT_URI",
                defaultValue: "http://localhost:3001/api/v1/github/oauth/callback",
            }),
            clientId: parseEnvString({
                key: "GITHUB_CLIENT_ID",
                defaultValue: "Ov23lithVLvZKXe5crUR",
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
        // AI-grading workers (processors/ai/*) share ONE local qwen instance that
        // serves OLLAMA_NUM_PARALLEL (=10) requests at a time. Pulling more jobs
        // than that just piles up in-flight HTTP calls blocked on Ollama, so cap
        // these workers to match the model's parallel slots; the rest wait in Redis.
        aiConcurrency: parseEnvInt({
            key: "BULLMQ_AI_CONCURRENCY",
            defaultValue: 10,
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
        /**
         * Short pause applied at the start of every job enqueue so clients can show loading state without a flash.
         */
        enqueueUxDelay: parseEnvMs({
            key: "BULLMQ_ENQUEUE_UX_DELAY",
            defaultValue: "100ms",
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
            // generate-cv pipeline steps: gather → compose → render → score → complete (5).
            maxSteps: parseEnvInt({
                key: "JOB_PROCESS.CV_SUBMISSION_MAX_STEPS",
                defaultValue: 5,
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
        /**
         * Process Google Docs Submission job configuration. Kept as its own key (rather
         * than reusing `processGitSubmission`) so tuning the Git pipeline's step count can
         * never silently retune this one too.
         */
        processGoogleDocsSubmission: {
            maxSteps: parseEnvInt({
                key: "JOB_PROCESS_GOOGLE_DOCS_SUBMISSION_MAX_STEPS",
                defaultValue: 2,
            }),
        },
        /** Send Mail job configuration. */
        sendMail: {
            maxSteps: parseEnvInt({
                key: "JOB_SEND_MAIL_MAX_STEPS",
                defaultValue: 1,
            }),
        },
        /** Judge Coding Submission job configuration. */
        judgeCodingSubmission: {
            maxSteps: parseEnvInt({
                key: "JOB_JUDGE_CODING_SUBMISSION_MAX_STEPS",
                defaultValue: 1,
            }),
            /** Minimum gap between a user's coding submits (anti-spam, mirrors throttler). */
            cooldownMs: parseEnvMs({
                key: "CODING_SUBMISSION_COOLDOWN_MS",
                defaultValue: "3s",
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
        /**
         * When true, indices listed in `src/modules/elasticsearch/mappings` are (re)created with their
         * explicit mapping instead of Elasticsearch's dynamic mapping — required for SCHEMA V2
         * challenges whose large jsonb blobs otherwise break dynamic indexing.
         */
        applyIndexMappings: parseEnvBoolean({
            key: "ELASTICSEARCH_APPLY_INDEX_MAPPINGS",
            defaultValue: false,
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
        /**
         * Timeout for the initial NATS dial (TCP + protocol handshake). Generous
         * by default because the boot-time dial can race a saturated event loop
         * (module init + Kafka consumers + content seed) on a memory-constrained
         * box, where a short timeout spuriously fails and crash-loops boot.
         */
        connectTimeoutMs: parseEnvMs({
            key: "NATS_CONNECT_TIMEOUT_MS", defaultValue: "60s"
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
    },
    /** AI model routing configuration. */
    ai: {
        /** "low" | "medium" | "high" — controls which model tier routers pick. */
        modelRecommendation: parseEnvString({
            key: "AI_MODEL_RECOMMENDATION",
            defaultValue: "low",
        }),
        /** Self-hosted (OpenAI-compatible) local provider config. */
        local: {
            /**
             * Base URL of the self-hosted OpenAI-compatible endpoint used by
             * `ModelProvider.Local` (Ollama default `http://localhost:11434/v1`,
             * vLLM `http://host:8000/v1`). Models tagged `local` route here.
             */
            baseUrl: parseEnvString({
                key: "OLLAMA_BASE_URL",
                defaultValue: "http://localhost:11434/v1",
            }),
        },
        /** OpenRouter (OpenAI-compatible aggregator gateway) config. */
        openrouter: {
            /**
             * Base URL of the OpenRouter OpenAI-compatible API used by
             * `ModelProvider.OpenRouter`. Models tagged `openrouter` route here.
             */
            baseUrl: parseEnvString({
                key: "OPENROUTER_BASE_URL",
                defaultValue: "https://openrouter.ai/api/v1",
            }),
        },
        /** Interval (ms) between provider quota re-check for unavailable providers. */
        quotaCheckIntervalMs: parseEnvMs({
            key: "AI_QUOTA_CHECK_INTERVAL_MS",
            defaultValue: "5m",
        }),
        /**
         * Hard per-attempt timeout for a single model call (invoke + stream). A
         * model that hasn't finished within this window is ABORTED and surfaced as
         * a TIMEOUT (classified Transient) so the balancer climbs to the next model
         * in the chain — distinct from a user-cancel (AbortError → stop). Generous
         * by design: real grading completions run 10–60s; keep this well above that
         * so only a truly hung request trips it (NOT slow-but-working models).
         */
        invokeTimeoutMs: parseEnvMs({
            key: "AI_INVOKE_TIMEOUT_MS",
            defaultValue: "75s",
        }),
        /** Scheduled mount-key ping sweeps (zero-token health probes). */
        ping: {
            /** When false, the staggered key ping scheduler stays idle. */
            enabled: parseEnvBoolean({
                key: "AI_PING_SCHEDULER_ENABLED",
                defaultValue: true,
            }),
            /**
             * Time (ms) between the **start** of consecutive key sweeps **per provider**.
             * Example: `5s` with three provider keys and `keyStaggerMs = 1s` retriggers
             * the provider sweep every 5s while keys fire at 0s / 1s / 2s within each sweep.
             */
            cycleIntervalMs: parseEnvMs({
                key: "AI_PING_CYCLE_INTERVAL_MS",
                defaultValue: "5s",
            }),
            /**
             * Gap (ms) between individual key pings inside one sweep — spreads
             * load to reduce provider rate-limit hits when many keys are mounted.
             */
            keyStaggerMs: parseEnvMs({
                key: "AI_PING_KEY_STAGGER_MS",
                defaultValue: "1s",
            }),
        },
        /**
         * Per-MODEL latency probe — a SEPARATE layer from {@link ai.ping}. Each
         * cycle runs a real 1-token completion against every enabled model,
         * measures round-trip latency + up/down, caches the snapshot and
         * broadcasts it over Socket.IO for the public status page. This is
         * UI/status only; it does NOT feed balancer key eligibility (that stays
         * with the per-provider key ping above).
         */
        latencyProbe: {
            /** When false, the staggered model-latency probe scheduler stays idle. */
            enabled: parseEnvBoolean({
                key: "AI_LATENCY_PROBE_ENABLED",
                defaultValue: true,
            }),
            /**
             * Time (ms) between the **start** of consecutive probe cycles. Each
             * cycle sweeps every enabled model once (staggered by
             * {@link staggerMs}). Defaults to 4h (the probe is metadata-cheap +
             * also runs once on boot) — health changes slowly, no need to hammer.
             */
            cycleIntervalMs: parseEnvMs({
                key: "AI_LATENCY_PROBE_CYCLE_INTERVAL_MS",
                defaultValue: "4h",
            }),
            /**
             * Gap (ms) between individual model probes inside one cycle — spreads
             * load so a fleet of models is not probed all at once. Defaults to 1s.
             */
            staggerMs: parseEnvMs({
                key: "AI_LATENCY_PROBE_STAGGER_MS",
                defaultValue: "1s",
            }),
            /**
             * Hard per-probe timeout (ms). A model that does not answer the
             * 1-token completion within this window is recorded down. Short (15s) —
             * distinct from the generous {@link ai.invokeTimeoutMs} used for real
             * grading runs, but slack enough for slow free models (e.g. OpenRouter
             * `:free`) to answer instead of getting aborted.
             */
            timeoutMs: parseEnvMs({
                key: "AI_LATENCY_PROBE_TIMEOUT_MS",
                defaultValue: "15s",
            }),
            /**
             * Which models the probe covers: `all` = every enabled model;
             * `freeLocal` = only `Local`-provider or `Free`-category models (the
             * always-on free lane). Defaults to `all`.
             */
            scope: parseEnvString({
                key: "AI_LATENCY_PROBE_SCOPE",
                defaultValue: "all",
            }),
        },
    },
    /** AI Balancer (key rotation) tunables. */
    aiBalancer: {
        /**
         * Max `(model, key)` attempts for the Auto lane of {@link UseApiService.useApi}
         * before throwing {@link AllModelsExhaustedException}.
         */
        maxAutoAttempts: parseEnvInt({
            key: "AI_BALANCER_MAX_AUTO_ATTEMPTS",
            defaultValue: 20,
        }),
    },
    /** Flashcardlet-style interview-prep (SM-2 spaced repetition) tunables. */
    flashcard: {
        /**
         * Scheduling interval (in days) at or above which a card is considered
         * Mastered. Cards below this stay in the Review bucket.
         */
        masteredIntervalDays: parseEnvInt({
            key: "FLASHCARD_MASTERED_INTERVAL_DAYS",
            defaultValue: 21,
        }),
    },
    /**
     * Installment ("trả góp") payment tunables — see `docs/installment-payment-plan.md`.
     * A NEW-buyer `Fixed` plan snapshots the markup for its chosen term at checkout
     * (later config changes never re-price a live plan); a Pioneer `FlexiblePool`
     * plan owes a real balance with no markup and pays a percentage-of-remaining
     * floored minimum each cycle. The two grace windows drive the enforcement cron.
     */
    installment: {
        /**
         * Markup percent added to the (loyalty/bundle-discounted) price per
         * chosen term. The keys ARE the offered month options — a value the map
         * has no key for is not a valid term. Fixed to 3-month ONLY (thầy
         * 2026-07-14: "không cho extend thời gian" — no 6/12-month terms
         * offered; a single fixed term keeps the plan simple, no term picker
         * needed on the FE).
         */
        markupPercentByMonths: {
            3: parseEnvInt({
                key: "INSTALLMENT_MARKUP_PERCENT_3M",
                defaultValue: 10,
            }),
        } as Record<number, number>,
        /** FlexiblePool per-cycle minimum = max(remaining × this%, floor). */
        minPaymentPercent: parseEnvInt({
            key: "INSTALLMENT_MIN_PAYMENT_PERCENT",
            defaultValue: 10,
        }),
        /** FlexiblePool absolute per-cycle minimum floor, VND. */
        minPaymentFloorVnd: parseEnvInt({
            key: "INSTALLMENT_MIN_PAYMENT_FLOOR_VND",
            defaultValue: 500_000,
        }),
        /** Days after due before the 2nd (pre-lock) reminder fires. */
        graceReminderDays: parseEnvInt({
            key: "INSTALLMENT_GRACE_REMINDER_DAYS",
            defaultValue: 7,
        }),
        /** Total days after due before the plan defaults and locks access. */
        graceLockoutDays: parseEnvInt({
            key: "INSTALLMENT_GRACE_LOCKOUT_DAYS",
            defaultValue: 14,
        }),
    },
    /**
     * Kafka configuration consumed by the CDC progress-projection listener.
     * Debezium streams Postgres row-changes into Kafka topics; the listener
     * connects to {@link brokers} and reacts to topics under {@link cdcTopicPrefix}.
     */
    kafka: {
        /**
         * Comma-separated list of Kafka broker addresses, split into a string
         * array. Defaults to the local KRaft broker exposed on the host.
         */
        brokers: parseEnvString({
            key: "KAFKA_BROKERS",
            defaultValue: "localhost:29092",
        })
            // split the comma-separated list into individual broker endpoints
            .split(",")
            // trim incidental whitespace so "a, b" parses cleanly
            .map((broker) => broker.trim())
            // drop empty entries (trailing comma / blank env value)
            .filter((broker) => broker !== ""),
        /**
         * Prefix Debezium uses for the CDC topics (server name + schema). The
         * listener appends the table name to build each topic — e.g.
         * `${cdcTopicPrefix}user_contents`.
         */
        cdcTopicPrefix: parseEnvString({
            key: "KAFKA_CDC_TOPIC_PREFIX",
            defaultValue: "starci.public.",
        }),
    },
    /**
     * CQRS projection read-models. Projection rows are kept fresh eagerly by
     * inline recompute (in the write transaction) + the CDC listeners; the TTL
     * below is the LAZY safety net — a read that finds its projection row older
     * than {@link staleAfterMs} recomputes it on the spot before returning, so a
     * gap in both eager paths self-heals within one TTL window. This replaces the
     * old Redis cache-aside layer (the projection table IS the cache now).
     */
    projection: {
        /**
         * Max age before a projection row is considered stale on read and lazily
         * recomputed. Defaults to 5 minutes.
         */
        staleAfterMs: parseEnvMs({
            key: "PROJECTION_STALE_AFTER_MS",
            defaultValue: "5m",
        }),
    },
    /** User profile (avatar upload) tunables. */
    profile: {
        /**
         * Maximum accepted avatar upload size in bytes. Uploads above this are
         * rejected before touching S3. Defaults to 5 MB.
         */
        avatarMaxBytes: parseEnvInt({
            key: "PROFILE_AVATAR_MAX_BYTES",
            defaultValue: 5 * 1024 * 1024,
        }),
    },
    /**
     * Duolingo-style global weekly-league tunables. The league ranks users by
     * their flat reward points (`xp_histories.points`) within a fixed Sunday→Sunday
     * (Asia/Ho_Chi_Minh) week window inside a fixed-size cohort, promoting the top
     * performers and demoting the laggards each week.
     */
    league: {
        /**
         * Cron expression for the weekly reset job (close ending cohorts +
         * promote/demote + form new cohorts). Defaults to every Sunday 00:00;
         * the `@Cron` decorator runs it in the Asia/Ho_Chi_Minh timezone.
         */
        weeklyResetCron: parseEnvString({
            key: "LEAGUE_WEEKLY_RESET_CRON",
            defaultValue: "0 0 * * 0",
        }),
        /** Number of users that make up one weekly cohort. */
        cohortSize: parseEnvInt({
            key: "LEAGUE_COHORT_SIZE",
            defaultValue: 30,
        }),
        /** How many top-ranked cohort members promote to the next tier each week. */
        promoteCount: parseEnvInt({
            key: "LEAGUE_PROMOTE_COUNT",
            defaultValue: 10,
        }),
        /** How many bottom-ranked cohort members demote to the previous tier each week. */
        demoteCount: parseEnvInt({
            key: "LEAGUE_DEMOTE_COUNT",
            defaultValue: 5,
        }),
    },
}
)
