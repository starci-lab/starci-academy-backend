/**
 * Enum of cache key names used for Redis/memory cache entries.
 * Each key corresponds to a cache namespace and its result type.
 */
export enum CacheKey {
    /**
     * Shared email `ScalableBloomFilter`. Effectively infinite TTL; seeded at init
     * and updated on write. Expiry (or a replaced instance) forces a full Postgres
     * resync -- until then membership checks false-negative and fail open.
     */
    BloomFilter = "bloom.filter",
    /**
     * In-process NATS message digest. ~3s TTL is the only eviction -- after expiry
     * the same digest can be re-emitted locally (duplicate EventEmitter dispatch).
     */
    NatsMessageDigest = "nats.message.digest",
    /**
     * Socket.IO client id subscribed to a job room. ~15m TTL drops the mapping so
     * a reconnecting client must re-subscribe or progress events are lost.
     */
    JobSubscriberClientId = "job.subscriber.client_id",
    /**
     * Parent graph (ids + displayIds) for autocomplete/deep-links. Effectively
     * infinite TTL; stale until indexer sync overwrites -- a missed rebuild leaves
     * wrong parents indefinitely.
     */
    ParentIndex = "parent.index",
    /**
     * OIDC PKCE verifier + post-login redirect keyed by provider+state. Cleared
     * after token exchange; ~15m TTL expiry throws `OidcStateExpiredException`
     * and the login must restart.
     */
    KeycloakOidcPkce = "keycloak.oidc.pkce",
    /**
     * Keycloak `sub` -> internal user id only (other `UserEntity` fields are unset).
     * Effectively infinite TTL; a remapped sub stays wrong until del/expiry.
     */
    KeycloakUser = "keycloak.user",
    /**
     * Per-user enrolled course-id set (authz hot path). Del-on-write on
     * enroll/refund; 1h TTL is a safety net if invalidation is missed (stale
     * grant/deny until then).
     */
    UserEnrolledCourses = "user.enrolled-courses",
    /**
     * Per-user `profileLocked` boolean. Del-on-write on profile update; 1h TTL
     * self-heals a missed invalidation (stale lock/unlock until then).
     */
    UserProfileLocked = "user.profile-locked",
    /**
     * Enrollment milestone/task list for the GraphQL cache interceptor. ~15m TTL
     * with no del-on-write -- progress/structure changes stay stale until expiry.
     */
    EnrollmentMilestones = "enrollment.milestones",
    /**
     * Hydrated `milestone` GraphQL response keyed by milestone id. Shares the
     * ~15m enrollment-milestones TTL; catalog edits stay stale until expiry.
     */
    Milestone = "milestone",
    /**
     * Hydrated `task` GraphQL response keyed by task id. Same ~15m TTL as
     * {@link CacheKey.Milestone}; S3/criteria edits stay stale until expiry.
     */
    MilestoneTask = "milestone.task",
    /**
     * Per-enrollment personal-project task progress. Effectively infinite TTL;
     * correctness depends on `invalidateProgress` after attempts -- a miss leaves
     * stale completion until then.
     */
    MilestoneTaskProgress = "milestone.task.progress",
    /**
     * Per-user coding solved/attempted/revealed ids + points. Del-on-write after
     * judging; 5m TTL self-heals a missed invalidation.
     */
    CodingProblemProgress = "coding.problem.progress",
    /**
     * Per-user AI credit window snapshot. 5m TTL is the eviction path -- quota
     * reads can over/under-count until expiry after a charge.
     */
    CreditUsage = "credit.usage",
    /**
     * Authored course mind-map graph. 1h TTL; live query now hits Postgres
     * directly -- any remaining consumer serves stale layout until expiry after re-seed.
     */
    CourseMindMap = "course.mind-map",
    /** AI ping mount-key health snapshots keyed by provider then API key. */
    AiPingKeyStatus = "ai.ping.key-status",
    /** AI per-model latency probe snapshots keyed by model name. */
    AiModelLatency = "ai.model.latency",
    /** Display label for an entity reference, keyed by entityName + id + locale. */
    EntityLabel = "entity.label",
}

/**
 * Enum of bloom filter types.
 */
export enum BloomFilterType {
    /**
     * Email bloom filter.
     */
    Email = "email",
}