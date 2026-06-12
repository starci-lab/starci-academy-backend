/** Log event names; each maps to a config entry in configMap (level, loki, messageType). */
export enum WinstonLog {
    CoursesSeededSuccessfully = "CoursesSeededSuccessfully",
    /** Init seeder: single mount entity skipped (parse/load error). */
    InitSeederEntitySkipped = "InitSeederEntitySkipped",
    /** DB seeder: entity row created, updated, or deleted. */
    DbSynchronizerSyncedSuccessfully = "DbSynchronizerSyncedSuccessfully",
    ContextFileLoadedSuccessfully = "ContextFileLoadedSuccessfully",
    EnrollmentCreated = "EnrollmentCreated",
    EnrollStepExecuted = "EnrollStepExecuted",
    ProcessGitSubmissionStepExecuted = "ProcessGitSubmissionStepExecuted",
    /** Generic worker / pipeline step completed (reusable across processors). */
    ProcessStepExecuted = "ProcessStepExecuted",
    ProcessCVSubmissionStepExecuted = "ProcessCVSubmissionStepExecuted",
    JobExecutedSuccessfully = "JobExecutedSuccessfully",
    JobExecutedFailed = "JobExecutedFailed",
    EnrollmentAlreadyExists = "EnrollmentAlreadyExists",
    CdnSynchronizerCoursesSyncing = "CdnSynchronizerCoursesSyncing",
    CdnSynchronizerCourseSyncedSuccessfully = "CdnSynchronizerCourseSyncedSuccessfully",
    CdnSynchronizerCourseAlreadySynced = "CdnSynchronizerCourseAlreadySynced",
    CdnSynchronizerCourseSyncFailed = "CdnSynchronizerCourseSyncFailed",
    CdnSynchronizerCourseSyncFailedMaxRetriesReached = "CdnSynchronizerCourseSyncFailedMaxRetriesReached",
    CdnSynchronizerCourseSyncFailedAttempt = "CdnSynchronizerCourseSyncFailedAttempt",
    CdnSynchronizerChallengeRuntimeSyncFailed = "CdnSynchronizerChallengeRuntimeSyncFailed",
    CdnSynchronizerCourseRuntimeSyncFailed = "CdnSynchronizerCourseRuntimeSyncFailed",
    CdnSynchronizerModuleRuntimeSyncFailed = "CdnSynchronizerModuleRuntimeSyncFailed",
    CdnSynchronizerContentRuntimeSyncFailed = "CdnSynchronizerContentRuntimeSyncFailed",
    /** CDN synchronizer: sync cycle started. */
    CdnSynchronizerCdnSyncStarted = "CdnSynchronizerCdnSyncStarted",
    /** CDN synchronizer: entity-kind pass started (Course, Challenge, …). */
    CdnSynchronizerEntityKindStarted = "CdnSynchronizerEntityKindStarted",
    /** CDN synchronizer: single entity sync started (before hydrate/upload). */
    CdnSynchronizerEntitySyncStarted = "CdnSynchronizerEntitySyncStarted",
    /** CDN synchronizer: entity skipped (out of scope). */
    CdnSynchronizerEntitySkipped = "CdnSynchronizerEntitySkipped",
    /** CDN synchronizer: hydrate/upload sub-step (course hydrate, S3 put, …). */
    CdnSynchronizerMaterializeStep = "CdnSynchronizerMaterializeStep",
    /** CDN synchronizer: single entity synced successfully. */
    CdnSynchronizerSyncedSuccessfully = "CdnSynchronizerSyncedSuccessfully",
    /** CDN synchronizer: sync cycle completed. */
    CdnSynchronizerCdnSyncDone = "CdnSynchronizerCdnSyncDone",
    /** CDN synchronizer: entity sync failed after retries. */
    CdnSynchronizerEntitySyncFailed = "CdnSynchronizerEntitySyncFailed",
    /** CDN synchronizer reconcile: orphan keys found (diff vs database). */
    CdnSynchronizerReconcileOrphansFound = "CdnSynchronizerReconcileOrphansFound",
    /** CDN synchronizer reconcile: orphan keys deleted from a provider. */
    CdnSynchronizerReconcileOrphansDeleted = "CdnSynchronizerReconcileOrphansDeleted",
    /** CDN synchronizer reconcile: deletion skipped because orphan ratio exceeded the safety threshold. */
    CdnSynchronizerReconcileSkippedBySafety = "CdnSynchronizerReconcileSkippedBySafety",
    /** Elasticsearch index reset: started dropping/recreating indices at boot. */
    ElasticsearchIndexResetStarted = "ElasticsearchIndexResetStarted",
    /** Elasticsearch index reset: finished — indices empty and awaiting sync. */
    ElasticsearchIndexResetDone = "ElasticsearchIndexResetDone",
    /** Elasticsearch synchronizer: sync cycle started. */
    EsSynchronizerSyncStarted = "EsSynchronizerSyncStarted",
    /** Elasticsearch synchronizer: old deprecated cron sync log. */
    EsSynchronizerEntitiesSyncing = "EsSynchronizerEntitiesSyncing",
    /** Elasticsearch synchronizer: single entity synced successfully. */
    EsSynchronizerSyncedSuccessfully = "EsSynchronizerSyncedSuccessfully",
    /** Elasticsearch synchronizer: sync cycle completed. */
    EsSynchronizerSyncDone = "EsSynchronizerSyncDone",
    /** Elasticsearch synchronizer: entity sync failed. */
    EsSynchronizerEntitySyncFailed = "EsSynchronizerEntitySyncFailed",
    /** Elasticsearch synchronizer reconcile: orphan docs found (diff vs database). */
    EsSynchronizerReconcileOrphansFound = "EsSynchronizerReconcileOrphansFound",
    /** Elasticsearch synchronizer reconcile: orphan docs deleted from an index. */
    EsSynchronizerReconcileOrphansDeleted = "EsSynchronizerReconcileOrphansDeleted",
    /** Elasticsearch synchronizer reconcile: deletion skipped because orphan ratio exceeded the safety threshold. */
    EsSynchronizerReconcileSkippedBySafety = "EsSynchronizerReconcileSkippedBySafety",
    /** Indexer synchronizer: sync cycle started. */
    IndexerSynchronizerSyncStarted = "IndexerSynchronizerSyncStarted",
    /** Indexer synchronizer: old deprecated cron sync log. */
    IndexerSynchronizerEntitiesSyncing = "IndexerSynchronizerEntitiesSyncing",
    /** Indexer synchronizer: single entity synced successfully. */
    IndexerSynchronizerSyncedSuccessfully = "IndexerSynchronizerSyncedSuccessfully",
    /** Indexer synchronizer: sync cycle completed. */
    IndexerSynchronizerSyncDone = "IndexerSynchronizerSyncDone",
    /** Indexer synchronizer: entity sync failed. */
    IndexerSynchronizerEntitySyncFailed = "IndexerSynchronizerEntitySyncFailed",
    /** Bloom filter synchronizer: sync cycle started. */
    BloomFilterSynchronizerSyncStarted = "BloomFilterSynchronizerSyncStarted",
    /** Bloom filter synchronizer: old deprecated cron sync log. */
    BloomFilterSynchronizerEntitiesSyncing = "BloomFilterSynchronizerEntitiesSyncing",
    /** Bloom filter synchronizer: filter created. */
    BloomFilterSynchronizerFilterCreated = "BloomFilterSynchronizerFilterCreated",
    /** Bloom filter synchronizer: filter already exists. */
    BloomFilterSynchronizerFilterAlreadyExists = "BloomFilterSynchronizerFilterAlreadyExists",
    /** Bloom filter synchronizer: emails synced. */
    BloomFilterSynchronizerEmailsSynced = "BloomFilterSynchronizerEmailsSynced",
    /** Bloom filter synchronizer: sync cycle completed. */
    BloomFilterSynchronizerSyncDone = "BloomFilterSynchronizerSyncDone",
    /** Bloom filter synchronizer: entity sync failed after retries. */
    BloomFilterSynchronizerEntitySyncFailed = "BloomFilterSynchronizerEntitySyncFailed",
    /** Repo synchronizer: sync cycle started. */
    RepoSynchronizerSyncStarted = "RepoSynchronizerSyncStarted",
    /** Repo synchronizer: sandbox content files uploaded to CDN. */
    RepoSynchronizerContentSynced = "RepoSynchronizerContentSynced",
    /** Repo synchronizer: failed to sync a sandbox content. */
    RepoSynchronizerContentSyncFailed = "RepoSynchronizerContentSyncFailed",
    /** Repo synchronizer: sync cycle completed. */
    RepoSynchronizerSyncDone = "RepoSynchronizerSyncDone",
    /** Sync orchestrator: orchestration started. */
    SyncOrchestratorStarted = "SyncOrchestratorStarted",
    /** Sync orchestrator: orchestration completed. */
    SyncOrchestratorDone = "SyncOrchestratorDone",
    /** CLI: missing subcommand or invalid invocation. */
    CommandError = "CommandError",
    /** CLI: command finished successfully. */
    CommandSuccess = "CommandSuccess",
    /** NATS consumer opened (bridge). */
    NatsConsumerOpened = "NatsConsumerOpened",
    /** NATS consumer closed (bridge). */
    NatsConsumerClosed = "NatsConsumerClosed",
    /** NATS consumer error (bridge). */
    NatsConsumerError = "NatsConsumerError",
    /** Cache: error while getting a cache entry. */
    ErrorGettingCache = "ErrorGettingCache",
    /** Cache: error while setting a cache entry. */
    ErrorSettingCache = "ErrorSettingCache",
    /** Cache: error while deleting a cache entry. */
    ErrorDeletingCache = "ErrorDeletingCache",
    /** Cache debug: Redis manager is OK. */
    CacheDebugOkRedis = "CacheDebugOkRedis",
    /** Cache debug: Memory manager is OK. */
    CacheDebugOkMemory = "CacheDebugOkMemory",
    /** Backup: PostgreSQL backup completed successfully. */
    PgBackupCompletedSuccessfully = "PgBackupCompletedSuccessfully",
    /** Backup: PostgreSQL backup failed. */
    PgBackupFailed = "PgBackupFailed",
    /** Backup: pg_dump failed. */
    PgBackupDumpFailed = "PgBackupDumpFailed",
    /** Backup: gzip compression failed. */
    PgBackupCompressFailed = "PgBackupCompressFailed",
    /** Backup: openssl encryption failed. */
    PgBackupEncryptFailed = "PgBackupEncryptFailed",
    /** Backup: S3 upload failed. */
    PgBackupUploadFailed = "PgBackupUploadFailed",
    /** AI model router: model resolved/switched. */
    AiModelRouterResolved = "AiModelRouterResolved",
    /** AI model router: provider marked unavailable (quota/error). */
    AiModelRouterFailure = "AiModelRouterFailure",
    /** AI model router: proactive re-check cleared unavailable providers. */
    AiModelRouterRecheck = "AiModelRouterRecheck",
    /** AI ping: provider ping result (success/failure). */
    AiPingResult = "AiPingResult",
    /** Init seeder: finished a seeder pass with upsert count. */
    SeederFinished = "SeederFinished",
    /** AI Balancer: key store reloaded keys from mount file. */
    AiBalancerKeysReloaded = "AiBalancerKeysReloaded",
    /** AI Balancer: a key was disabled after failure threshold. */
    AiBalancerKeyDisabled = "AiBalancerKeyDisabled",
    /** AI Balancer: a previously-disabled key recovered on retry. */
    AiBalancerKeyRecovered = "AiBalancerKeyRecovered",
    /** AI Balancer: rotation selected a key. */
    AiBalancerKeyPicked = "AiBalancerKeyPicked",
    /** AI Balancer: no active key available for a provider. */
    AiBalancerNoActiveKey = "AiBalancerNoActiveKey",
    /** Transaction reconcile: a delayed poll was scheduled. */
    TransactionReconcileScheduled = "TransactionReconcileScheduled",
    /** Transaction reconcile: a poll ran (gateway status + decision taken). */
    TransactionReconcilePolled = "TransactionReconcilePolled",
    /** Transaction reconcile: startup sweep re-enqueued pending transactions. */
    TransactionReconcileBootSweep = "TransactionReconcileBootSweep",
    /** Data-git bootstrap: started resolving the remote ref / commit SHA. */
    DataGitBootstrapStarted = "DataGitBootstrapStarted",
    /** Data-git bootstrap: remote SHA matches the local marker — no download. */
    DataGitBootstrapUpToDate = "DataGitBootstrapUpToDate",
    /** Data-git bootstrap: tarball downloaded and extracted into the data root. */
    DataGitBootstrapUpdated = "DataGitBootstrapUpdated",
    /** Data-git bootstrap: failed to fetch or extract the remote data repo. */
    DataGitBootstrapFailed = "DataGitBootstrapFailed",
    /** Data-git diff: resolved how the seed/sync scope was narrowed for this boot. */
    DataGitDiffScoped = "DataGitDiffScoped",
    /** Reconcile: skipped pruning a target because the delete ratio was unsafe. */
    ReconcileOrphansSkipped = "ReconcileOrphansSkipped",
    /** Reconcile: finished pruning ES/CDN orphans for the boot. */
    ReconcileOrphansDone = "ReconcileOrphansDone"
    }
