/**
 * Enum of BullMQ queue names used across the system.
 * Each name corresponds to a specific type of background job queue.
 */
export enum BullQueueName {
    /** Queue name for enroll jobs. */
    Enroll = "enroll",
    /** Queue for grading a GitHub submission against outcome/approach criteria. */
    ProcessGitSubmission = "process-git-submission",
    /** Queue for grading a Google Docs submission against outcome/approach criteria. */
    ProcessGoogleDocsSubmission = "process-google-docs-submission",
    /** Queue for resolving GitHub organization/team membership. */
    ResolveGithub = "resolve-github",
    /** Queue for revoking GitHub organization/team membership (course access removal). */
    RevokeGithub = "revoke-github",
    /** Queue for processing video (encode mp4/mkv to mpeg-dash and hls). */
    ProcessVideo = "process-video",
    /** Queue for sending transactional emails via SMTP (Brevo). */
    SendMail = "send-mail",
    /** Queue for synchronizing source entities into ScyllaDB. */
    SyncScyllaDB = "sync-scylladb",
    /** Rebuild the shared email ScalableBloomFilter from PostgreSQL users (batched). */
    SyncEmailBloomFilter = "sync-email-bloom-filter",
    /** Prime parent-index cache for courses/challenges/contents/modules (batched). */
    SyncIndexer = "sync-indexer",
    /** On-demand sync of one course/challenge/content to CDN storage. */
    SyncCdn = "sync-cdn",
    /** On-demand index of one course/challenge/content into Elasticsearch. */
    SyncElasticsearch = "sync-elasticsearch",
    /** Queue for grading a personal project GitHub submission against task criteria. */
    ProcessPersonalProject = "process-personal-project",
    /** Queue for AI-generating personalized tasks from course context + user idea. */
    GeneratePersonalProjectTasks = "generate-personal-project-tasks",
    /** Queue for AI-reviewing a single personal project task against its criteria. */
    ReviewPersonalProjectTask = "review-personal-project-task",
    /** Queue for judging a coding-practice submission against testcases via Judge0. */
    JudgeCodingSubmission = "judge-coding-submission",
    /** Queue for polling a pending payment transaction's gateway status (delayed, repeated). */
    ReconcileTransaction = "reconcile-transaction",
    /** Queue for grading an AI Lab eval submission (prompt template) against an eval set. */
    ReviewAiLabEval = "review-ai-lab-eval",
    /** Queue for AI-generating (or revising) a CV from user input / verified achievements. */
    GenerateCv = "generate-cv",
}
