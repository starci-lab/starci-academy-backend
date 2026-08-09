
import {
    WinstonLog,
} from "./enums/winston-log"
import {
    WinstonLevel,
} from "./types/level"
import {
    CoursesSeededSuccessfullyMessage,
    InitSeederEntitySkippedMessage,
    ContextFileLoadedSuccessfullyMessage,
} from "./types/messages/courses"
import {
    DbSynchronizerSyncedSuccessfullyMessage,
} from "./types/messages/db-synchronizer"
import {
    EnrollmentAlreadyExistsMessage,
    EnrollmentCreatedMessage,
} from "./types/messages/enrollment"
import {
    StepExecutedMessage,
    JobExecutedMessage,
} from "./types/messages/worker"
import type {
    SeederFinishedMessage,
    AiBalancerKeysReloadedMessage,
    AiBalancerKeyDisabledMessage,
    AiBalancerKeyRecoveredMessage,
    AiBalancerKeyPickedMessage,
    AiBalancerNoActiveKeyMessage,
} from "./types/messages/ai-balancer"
import type {
    AiModelRouterResolvedMessage,
    AiModelRouterFailureMessage,
    AiModelRouterRecheckMessage,
    AiPingResultMessage,
} from "./types/messages/ai-model-router"
import type {
    PgBackupCompletedSuccessfullyMessage,
    PgBackupFailedMessage,
    PgBackupStepFailedMessage,
} from "./types/messages/backup"
import type {
    BloomFilterSynchronizerSyncStartedMessage,
    BloomFilterSynchronizerFilterCreatedMessage,
    BloomFilterSynchronizerFilterAlreadyExistsMessage,
    BloomFilterSynchronizerEmailsSyncedMessage,
    BloomFilterSynchronizerSyncDoneMessage,
    BloomFilterSynchronizerEntitySyncFailedMessage,
} from "./types/messages/bloom-filter-synchronizer"
import type {
    ErrorDeletingCacheMessage,
    ErrorGettingCacheMessage,
    ErrorSettingCacheMessage,
    CacheDebugOkMemoryMessage,
    CacheDebugOkRedisMessage,
} from "./types/messages/cache"
import type {
    CdnSynchronizerCourseAlreadySyncedMessage,
    CdnSynchronizerCourseSyncFailedAttemptMessage,
    CdnSynchronizerCourseSyncFailedMessage,
    CdnSynchronizerCoursesSyncingMessage,
    CdnSynchronizerCourseSyncFailedMaxRetriesReachedMessage,
    CdnSynchronizerCourseSyncedSuccessfullyMessage,
    CdnSynchronizerChallengeRuntimeSyncFailedMessage,
    CdnSynchronizerCourseRuntimeSyncFailedMessage,
    CdnSynchronizerModuleRuntimeSyncFailedMessage,
    CdnSynchronizerContentRuntimeSyncFailedMessage,
    CdnSynchronizerCdnSyncStartedMessage,
    CdnSynchronizerEntityKindStartedMessage,
    CdnSynchronizerEntitySyncStartedMessage,
    CdnSynchronizerEntitySkippedMessage,
    CdnSynchronizerMaterializeStepMessage,
    CdnSynchronizerSyncedSuccessfullyMessage,
    CdnSynchronizerCdnSyncDoneMessage,
    CdnSynchronizerEntitySyncFailedMessage,
    CdnSynchronizerReconcileOrphansFoundMessage,
    CdnSynchronizerReconcileOrphansDeletedMessage,
    CdnSynchronizerReconcileSkippedBySafetyMessage,
} from "./types/messages/cdn-synchronizer"
import type {
    CommandLogMessage,
} from "./types/messages/cli"
import type {
    ContentScrapeDetectedMessage,
} from "./types/messages/courses"
import type {
    DataGitBootstrapStartedMessage,
    DataGitBootstrapUpToDateMessage,
    DataGitBootstrapUpdatedMessage,
    DataGitBootstrapFailedMessage,
    DataGitDiffScopedMessage,
} from "./types/messages/data-git"
import type {
    ElasticsearchIndexResetStartedMessage,
    ElasticsearchIndexResetDoneMessage,
    ElasticsearchIndexMappingDriftedMessage,
    ElasticsearchIndexMappingRepairedMessage,
} from "./types/messages/elasticsearch-index-reset"
import type {
    EsSynchronizerSyncStartedMessage,
    EsSynchronizerSyncedSuccessfullyMessage,
    EsSynchronizerSyncDoneMessage,
    EsSynchronizerEntitySyncFailedMessage,
    EsSynchronizerReconcileOrphansFoundMessage,
    EsSynchronizerReconcileOrphansDeletedMessage,
    EsSynchronizerReconcileSkippedBySafetyMessage,
} from "./types/messages/elasticsearch-synchronizer"
import type {
    IndexerSynchronizerSyncStartedMessage,
    IndexerSynchronizerSyncedSuccessfullyMessage,
    IndexerSynchronizerSyncDoneMessage,
    IndexerSynchronizerEntitySyncFailedMessage,
} from "./types/messages/indexer-synchronizer"
import type {
    NatsConsumerClosedMessage,
    NatsConsumerErrorMessage,
    NatsConsumerOpenedMessage,
} from "./types/messages/nats"
import type {
    OpsLogMessage,
} from "./types/messages/ops"
import type {
    ReconcileOrphansSkippedMessage,
    ReconcileOrphansDoneMessage,
} from "./types/messages/reconcile"
import type {
    RepoSynchronizerSyncStartedMessage,
    RepoSynchronizerContentSyncedMessage,
    RepoSynchronizerContentSyncFailedMessage,
    RepoSynchronizerSyncDoneMessage,
} from "./types/messages/repo-synchronizer"
import type {
    SyncOrchestratorStartedMessage,
    SyncOrchestratorDoneMessage,
} from "./types/messages/sync-orchestrator"
import type {
    TransactionReconcileMessage,
} from "./types/messages/transaction"

/** Map of Winston log names to level, Loki flag, and message type. */
export const configMap = {
    // Courses Seeded Successfully
    [WinstonLog.CoursesSeededSuccessfully]: {
        name: WinstonLog.CoursesSeededSuccessfully,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CoursesSeededSuccessfullyMessage
    },
    [WinstonLog.InitSeederEntitySkipped]: {
        name: WinstonLog.InitSeederEntitySkipped,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as InitSeederEntitySkippedMessage
    },
    [WinstonLog.DbSynchronizerSyncedSuccessfully]: {
        name: WinstonLog.DbSynchronizerSyncedSuccessfully,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as DbSynchronizerSyncedSuccessfullyMessage
    },
    [WinstonLog.ContextFileLoadedSuccessfully]: {
        name: WinstonLog.ContextFileLoadedSuccessfully,
        level: WinstonLevel.Debug,
        loki: true,
        console: true,
        messageType: {
        } as ContextFileLoadedSuccessfullyMessage
    },
    // Enrollment worker logs.
    [WinstonLog.EnrollmentCreated]: {
        name: WinstonLog.EnrollmentCreated,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as EnrollmentCreatedMessage
    },
    [WinstonLog.EnrollmentAlreadyExists]: {
        name: WinstonLog.EnrollmentAlreadyExists,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as EnrollmentAlreadyExistsMessage
    },
    [WinstonLog.EnrollStepExecuted]: {
        name: WinstonLog.EnrollStepExecuted,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as StepExecutedMessage
    },
    [WinstonLog.ProcessGitSubmissionStepExecuted]: {
        name: WinstonLog.ProcessGitSubmissionStepExecuted,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as StepExecutedMessage
    },
    [WinstonLog.ProcessStepExecuted]: {
        name: WinstonLog.ProcessStepExecuted,
        level: WinstonLevel.Debug,
        loki: true,
        console: true,
        messageType: {
        } as StepExecutedMessage
    },
    [WinstonLog.ProcessCVSubmissionStepExecuted]: {
        name: WinstonLog.ProcessCVSubmissionStepExecuted,
        level: WinstonLevel.Debug,
        loki: true,
        console: true,
        messageType: {
        } as StepExecutedMessage
    },
    [WinstonLog.JobExecutedSuccessfully]: {
        name: WinstonLog.JobExecutedSuccessfully,
        level: WinstonLevel.Debug,
        loki: true,
        console: true,
        messageType: {
        } as JobExecutedMessage
    },
    [WinstonLog.JobExecutedFailed]: {
        name: WinstonLog.JobExecutedFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as JobExecutedMessage
    },
    [WinstonLog.NotificationCreateFailed]: {
        name: WinstonLog.NotificationCreateFailed,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as StepExecutedMessage
    },
    // CDN synchronizer: errors.
    [WinstonLog.CdnSynchronizerCoursesSyncing]: {
        name: WinstonLog.CdnSynchronizerCoursesSyncing,
        level: WinstonLevel.Debug,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCoursesSyncingMessage
    },
    [WinstonLog.CdnSynchronizerCourseSyncedSuccessfully]: {
        name: WinstonLog.CdnSynchronizerCourseSyncedSuccessfully,
        level: WinstonLevel.Debug,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseSyncedSuccessfullyMessage
    },
    [WinstonLog.CdnSynchronizerCourseAlreadySynced]: {
        name: WinstonLog.CdnSynchronizerCourseAlreadySynced,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseAlreadySyncedMessage
    },
    [WinstonLog.CdnSynchronizerCourseSyncFailed]: {
        name: WinstonLog.CdnSynchronizerCourseSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseSyncFailedMessage
    },
    [WinstonLog.CdnSynchronizerCourseSyncFailedAttempt]: {
        name: WinstonLog.CdnSynchronizerCourseSyncFailedAttempt,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseSyncFailedAttemptMessage
    },
    [WinstonLog.CdnSynchronizerCourseSyncFailedMaxRetriesReached]: {
        name: WinstonLog.CdnSynchronizerCourseSyncFailedMaxRetriesReached,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseSyncFailedMaxRetriesReachedMessage
    },
    [WinstonLog.CdnSynchronizerChallengeRuntimeSyncFailed]: {
        name: WinstonLog.CdnSynchronizerChallengeRuntimeSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerChallengeRuntimeSyncFailedMessage
    },
    [WinstonLog.CdnSynchronizerCourseRuntimeSyncFailed]: {
        name: WinstonLog.CdnSynchronizerCourseRuntimeSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCourseRuntimeSyncFailedMessage
    },
    [WinstonLog.CdnSynchronizerModuleRuntimeSyncFailed]: {
        name: WinstonLog.CdnSynchronizerModuleRuntimeSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerModuleRuntimeSyncFailedMessage
    },
    [WinstonLog.CdnSynchronizerContentRuntimeSyncFailed]: {
        name: WinstonLog.CdnSynchronizerContentRuntimeSyncFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerContentRuntimeSyncFailedMessage
    },
    [WinstonLog.CdnSynchronizerCdnSyncStarted]: {
        name: WinstonLog.CdnSynchronizerCdnSyncStarted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCdnSyncStartedMessage
    },
    [WinstonLog.CdnSynchronizerEntityKindStarted]: {
        name: WinstonLog.CdnSynchronizerEntityKindStarted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerEntityKindStartedMessage
    },
    [WinstonLog.CdnSynchronizerEntitySyncStarted]: {
        name: WinstonLog.CdnSynchronizerEntitySyncStarted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerEntitySyncStartedMessage
    },
    [WinstonLog.CdnSynchronizerEntitySkipped]: {
        name: WinstonLog.CdnSynchronizerEntitySkipped,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerEntitySkippedMessage
    },
    [WinstonLog.CdnSynchronizerMaterializeStep]: {
        name: WinstonLog.CdnSynchronizerMaterializeStep,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerMaterializeStepMessage
    },
    [WinstonLog.CdnSynchronizerSyncedSuccessfully]: {
        name: WinstonLog.CdnSynchronizerSyncedSuccessfully,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerSyncedSuccessfullyMessage
    },
    [WinstonLog.CdnSynchronizerCdnSyncDone]: {
        name: WinstonLog.CdnSynchronizerCdnSyncDone,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerCdnSyncDoneMessage
    },
    [WinstonLog.CdnSynchronizerEntitySyncFailed]: {
        name: WinstonLog.CdnSynchronizerEntitySyncFailed,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerEntitySyncFailedMessage
    },
    [WinstonLog.CdnSynchronizerReconcileOrphansFound]: {
        name: WinstonLog.CdnSynchronizerReconcileOrphansFound,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerReconcileOrphansFoundMessage
    },
    [WinstonLog.CdnSynchronizerReconcileOrphansDeleted]: {
        name: WinstonLog.CdnSynchronizerReconcileOrphansDeleted,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerReconcileOrphansDeletedMessage
    },
    [WinstonLog.CdnSynchronizerReconcileSkippedBySafety]: {
        name: WinstonLog.CdnSynchronizerReconcileSkippedBySafety,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as CdnSynchronizerReconcileSkippedBySafetyMessage
    },
    // Elasticsearch synchronizer logs.
    [WinstonLog.ElasticsearchIndexResetStarted]: {
        name: WinstonLog.ElasticsearchIndexResetStarted,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as ElasticsearchIndexResetStartedMessage
    },
    [WinstonLog.ElasticsearchIndexResetDone]: {
        name: WinstonLog.ElasticsearchIndexResetDone,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as ElasticsearchIndexResetDoneMessage
    },
    [WinstonLog.ElasticsearchIndexMappingDrifted]: {
        name: WinstonLog.ElasticsearchIndexMappingDrifted,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as ElasticsearchIndexMappingDriftedMessage
    },
    [WinstonLog.ElasticsearchIndexMappingRepaired]: {
        name: WinstonLog.ElasticsearchIndexMappingRepaired,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as ElasticsearchIndexMappingRepairedMessage
    },
    [WinstonLog.EsSynchronizerSyncStarted]: {
        name: WinstonLog.EsSynchronizerSyncStarted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as EsSynchronizerSyncStartedMessage
    },
    [WinstonLog.EsSynchronizerEntitiesSyncing]: {
        name: WinstonLog.EsSynchronizerEntitiesSyncing,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
            dump: ""
        }
    },
    [WinstonLog.EsSynchronizerSyncedSuccessfully]: {
        name: WinstonLog.EsSynchronizerSyncedSuccessfully,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as EsSynchronizerSyncedSuccessfullyMessage
    },
    [WinstonLog.EsSynchronizerSyncDone]: {
        name: WinstonLog.EsSynchronizerSyncDone,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as EsSynchronizerSyncDoneMessage
    },
    [WinstonLog.EsSynchronizerEntitySyncFailed]: {
        name: WinstonLog.EsSynchronizerEntitySyncFailed,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as EsSynchronizerEntitySyncFailedMessage
    },
    [WinstonLog.EsSynchronizerReconcileOrphansFound]: {
        name: WinstonLog.EsSynchronizerReconcileOrphansFound,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as EsSynchronizerReconcileOrphansFoundMessage
    },
    [WinstonLog.EsSynchronizerReconcileOrphansDeleted]: {
        name: WinstonLog.EsSynchronizerReconcileOrphansDeleted,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as EsSynchronizerReconcileOrphansDeletedMessage
    },
    [WinstonLog.EsSynchronizerReconcileSkippedBySafety]: {
        name: WinstonLog.EsSynchronizerReconcileSkippedBySafety,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as EsSynchronizerReconcileSkippedBySafetyMessage
    },
    // Indexer synchronizer logs.
    [WinstonLog.IndexerSynchronizerSyncStarted]: {
        name: WinstonLog.IndexerSynchronizerSyncStarted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as IndexerSynchronizerSyncStartedMessage
    },
    [WinstonLog.IndexerSynchronizerEntitiesSyncing]: {
        name: WinstonLog.IndexerSynchronizerEntitiesSyncing,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
            dump: ""
        }
    },
    [WinstonLog.IndexerSynchronizerSyncedSuccessfully]: {
        name: WinstonLog.IndexerSynchronizerSyncedSuccessfully,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as IndexerSynchronizerSyncedSuccessfullyMessage
    },
    [WinstonLog.IndexerSynchronizerSyncDone]: {
        name: WinstonLog.IndexerSynchronizerSyncDone,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as IndexerSynchronizerSyncDoneMessage
    },
    [WinstonLog.IndexerSynchronizerEntitySyncFailed]: {
        name: WinstonLog.IndexerSynchronizerEntitySyncFailed,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as IndexerSynchronizerEntitySyncFailedMessage
    },
    // Bloom filter synchronizer logs.
    [WinstonLog.BloomFilterSynchronizerSyncStarted]: {
        name: WinstonLog.BloomFilterSynchronizerSyncStarted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as BloomFilterSynchronizerSyncStartedMessage
    },
    [WinstonLog.BloomFilterSynchronizerEntitiesSyncing]: {
        name: WinstonLog.BloomFilterSynchronizerEntitiesSyncing,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
            dump: ""
        }
    },
    [WinstonLog.BloomFilterSynchronizerFilterCreated]: {
        name: WinstonLog.BloomFilterSynchronizerFilterCreated,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as BloomFilterSynchronizerFilterCreatedMessage
    },
    [WinstonLog.BloomFilterSynchronizerFilterAlreadyExists]: {
        name: WinstonLog.BloomFilterSynchronizerFilterAlreadyExists,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as BloomFilterSynchronizerFilterAlreadyExistsMessage
    },
    [WinstonLog.BloomFilterSynchronizerEmailsSynced]: {
        name: WinstonLog.BloomFilterSynchronizerEmailsSynced,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as BloomFilterSynchronizerEmailsSyncedMessage
    },
    [WinstonLog.BloomFilterSynchronizerSyncDone]: {
        name: WinstonLog.BloomFilterSynchronizerSyncDone,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as BloomFilterSynchronizerSyncDoneMessage
    },
    [WinstonLog.BloomFilterSynchronizerEntitySyncFailed]: {
        name: WinstonLog.BloomFilterSynchronizerEntitySyncFailed,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as BloomFilterSynchronizerEntitySyncFailedMessage
    },
    // Repo synchronizer logs.
    [WinstonLog.RepoSynchronizerSyncStarted]: {
        name: WinstonLog.RepoSynchronizerSyncStarted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as RepoSynchronizerSyncStartedMessage
    },
    [WinstonLog.RepoSynchronizerContentSynced]: {
        name: WinstonLog.RepoSynchronizerContentSynced,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as RepoSynchronizerContentSyncedMessage
    },
    [WinstonLog.RepoSynchronizerContentSyncFailed]: {
        name: WinstonLog.RepoSynchronizerContentSyncFailed,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as RepoSynchronizerContentSyncFailedMessage
    },
    [WinstonLog.RepoSynchronizerSyncDone]: {
        name: WinstonLog.RepoSynchronizerSyncDone,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as RepoSynchronizerSyncDoneMessage
    },
    // Sync orchestrator logs.
    [WinstonLog.SyncOrchestratorStarted]: {
        name: WinstonLog.SyncOrchestratorStarted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as SyncOrchestratorStartedMessage
    },
    [WinstonLog.SyncOrchestratorDone]: {
        name: WinstonLog.SyncOrchestratorDone,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as SyncOrchestratorDoneMessage
    },
    [WinstonLog.CommandError]: {
        name: WinstonLog.CommandError,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as CommandLogMessage
    },
    [WinstonLog.CommandSuccess]: {
        name: WinstonLog.CommandSuccess,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CommandLogMessage
    },
    // NATS bridge logs.
    [WinstonLog.NatsConsumerOpened]: {
        name: WinstonLog.NatsConsumerOpened,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as NatsConsumerOpenedMessage
    },
    [WinstonLog.NatsConsumerClosed]: {
        name: WinstonLog.NatsConsumerClosed,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as NatsConsumerClosedMessage
    },
    [WinstonLog.NatsConsumerError]: {
        name: WinstonLog.NatsConsumerError,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as NatsConsumerErrorMessage
    },
    // Cache service logs.
    [WinstonLog.ErrorGettingCache]: {
        name: WinstonLog.ErrorGettingCache,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as ErrorGettingCacheMessage
    },
    [WinstonLog.ErrorSettingCache]: {
        name: WinstonLog.ErrorSettingCache,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as ErrorSettingCacheMessage
    },
    [WinstonLog.ErrorDeletingCache]: {
        name: WinstonLog.ErrorDeletingCache,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as ErrorDeletingCacheMessage
    },
    [WinstonLog.CacheDebugOkRedis]: {
        name: WinstonLog.CacheDebugOkRedis,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CacheDebugOkRedisMessage
    },
    [WinstonLog.CacheDebugOkMemory]: {
        name: WinstonLog.CacheDebugOkMemory,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as CacheDebugOkMemoryMessage
    },
    // Backup logs.
    [WinstonLog.PgBackupCompletedSuccessfully]: {
        name: WinstonLog.PgBackupCompletedSuccessfully,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupCompletedSuccessfullyMessage
    },
    [WinstonLog.PgBackupFailed]: {
        name: WinstonLog.PgBackupFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupFailedMessage
    },
    [WinstonLog.PgBackupDumpFailed]: {
        name: WinstonLog.PgBackupDumpFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupStepFailedMessage
    },
    [WinstonLog.PgBackupCompressFailed]: {
        name: WinstonLog.PgBackupCompressFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupStepFailedMessage
    },
    [WinstonLog.PgBackupEncryptFailed]: {
        name: WinstonLog.PgBackupEncryptFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupStepFailedMessage
    },
    [WinstonLog.PgBackupUploadFailed]: {
        name: WinstonLog.PgBackupUploadFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as PgBackupStepFailedMessage
    },
    // AI model router logs.
    [WinstonLog.AiModelRouterResolved]: {
        name: WinstonLog.AiModelRouterResolved,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as AiModelRouterResolvedMessage
    },
    [WinstonLog.AiModelRouterFailure]: {
        name: WinstonLog.AiModelRouterFailure,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as AiModelRouterFailureMessage
    },
    [WinstonLog.AiModelRouterRecheck]: {
        name: WinstonLog.AiModelRouterRecheck,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as AiModelRouterRecheckMessage
    },
    [WinstonLog.AiPingResult]: {
        name: WinstonLog.AiPingResult,
        level: WinstonLevel.Debug,
        loki: true,
        console: true,
        messageType: {
        } as AiPingResultMessage
    },
    [WinstonLog.SeederFinished]: {
        name: WinstonLog.SeederFinished,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as SeederFinishedMessage
    },
    [WinstonLog.AiBalancerKeysReloaded]: {
        name: WinstonLog.AiBalancerKeysReloaded,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as AiBalancerKeysReloadedMessage
    },
    [WinstonLog.AiBalancerKeyDisabled]: {
        name: WinstonLog.AiBalancerKeyDisabled,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as AiBalancerKeyDisabledMessage
    },
    [WinstonLog.AiBalancerKeyRecovered]: {
        name: WinstonLog.AiBalancerKeyRecovered,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as AiBalancerKeyRecoveredMessage
    },
    [WinstonLog.AiBalancerKeyPicked]: {
        name: WinstonLog.AiBalancerKeyPicked,
        level: WinstonLevel.Debug,
        loki: true,
        console: true,
        messageType: {
        } as AiBalancerKeyPickedMessage
    },
    [WinstonLog.AiBalancerNoActiveKey]: {
        name: WinstonLog.AiBalancerNoActiveKey,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as AiBalancerNoActiveKeyMessage
    },
    [WinstonLog.TransactionReconcileScheduled]: {
        name: WinstonLog.TransactionReconcileScheduled,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as TransactionReconcileMessage
    },
    [WinstonLog.TransactionReconcilePolled]: {
        name: WinstonLog.TransactionReconcilePolled,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as TransactionReconcileMessage
    },
    [WinstonLog.TransactionReconcileBootSweep]: {
        name: WinstonLog.TransactionReconcileBootSweep,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as TransactionReconcileMessage
    },
    // Data-git bootstrap logs.
    [WinstonLog.DataGitBootstrapStarted]: {
        name: WinstonLog.DataGitBootstrapStarted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as DataGitBootstrapStartedMessage
    },
    [WinstonLog.DataGitBootstrapUpToDate]: {
        name: WinstonLog.DataGitBootstrapUpToDate,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as DataGitBootstrapUpToDateMessage
    },
    [WinstonLog.DataGitBootstrapUpdated]: {
        name: WinstonLog.DataGitBootstrapUpdated,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as DataGitBootstrapUpdatedMessage
    },
    [WinstonLog.DataGitBootstrapFailed]: {
        name: WinstonLog.DataGitBootstrapFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as DataGitBootstrapFailedMessage
    },
    [WinstonLog.DataGitDiffScoped]: {
        name: WinstonLog.DataGitDiffScoped,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as DataGitDiffScopedMessage
    },
    [WinstonLog.ReconcileOrphansSkipped]: {
        name: WinstonLog.ReconcileOrphansSkipped,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as ReconcileOrphansSkippedMessage
    },
    [WinstonLog.ReconcileOrphansDone]: {
        name: WinstonLog.ReconcileOrphansDone,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as ReconcileOrphansDoneMessage
    },
    [WinstonLog.ContentScrapeDetected]: {
        name: WinstonLog.ContentScrapeDetected,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as ContentScrapeDetectedMessage
    },
    [WinstonLog.PaymentWebhookReceived]: {
        name: WinstonLog.PaymentWebhookReceived,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.PaymentWebhookIgnored]: {
        name: WinstonLog.PaymentWebhookIgnored,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.MinioWebhookReceived]: {
        name: WinstonLog.MinioWebhookReceived,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.MinioWebhookIgnored]: {
        name: WinstonLog.MinioWebhookIgnored,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.VideoProcessingEnqueued]: {
        name: WinstonLog.VideoProcessingEnqueued,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.BestEffortOperationFailed]: {
        name: WinstonLog.BestEffortOperationFailed,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.RequestHandlingFailed]: {
        name: WinstonLog.RequestHandlingFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.RealtimeStreamFailed]: {
        name: WinstonLog.RealtimeStreamFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.RealtimeDebug]: {
        name: WinstonLog.RealtimeDebug,
        level: WinstonLevel.Debug,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.ToolsArtifactBuilt]: {
        name: WinstonLog.ToolsArtifactBuilt,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.ToolsOperationCompleted]: {
        name: WinstonLog.ToolsOperationCompleted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.ToolsOperationFailed]: {
        name: WinstonLog.ToolsOperationFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.CronTickCompleted]: {
        name: WinstonLog.CronTickCompleted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.CronTickFailed]: {
        name: WinstonLog.CronTickFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.CdcListenerSubscribed]: {
        name: WinstonLog.CdcListenerSubscribed,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.CdcListenerDisabled]: {
        name: WinstonLog.CdcListenerDisabled,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.InitPhaseCompleted]: {
        name: WinstonLog.InitPhaseCompleted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.InitPhaseFailed]: {
        name: WinstonLog.InitPhaseFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.IntegrationCallSucceeded]: {
        name: WinstonLog.IntegrationCallSucceeded,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.IntegrationCallFailed]: {
        name: WinstonLog.IntegrationCallFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.RagIndexProgress]: {
        name: WinstonLog.RagIndexProgress,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.RagRetrievalFailed]: {
        name: WinstonLog.RagRetrievalFailed,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.RagCleanupCompleted]: {
        name: WinstonLog.RagCleanupCompleted,
        level: WinstonLevel.Info,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.AsyncEventQueued]: {
        name: WinstonLog.AsyncEventQueued,
        level: WinstonLevel.Verbose,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.HttpExceptionLogged]: {
        name: WinstonLog.HttpExceptionLogged,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.HealthProbeFailed]: {
        name: WinstonLog.HealthProbeFailed,
        level: WinstonLevel.Warn,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
    [WinstonLog.AiModelLatencyFailed]: {
        name: WinstonLog.AiModelLatencyFailed,
        level: WinstonLevel.Error,
        loki: true,
        console: true,
        messageType: {
        } as OpsLogMessage
    },
}
