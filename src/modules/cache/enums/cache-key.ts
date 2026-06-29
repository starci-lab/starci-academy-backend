/**
 * Enum of cache key names used for Redis/memory cache entries.
 * Each key corresponds to a cache namespace and its result type.
 */
export enum CacheKey {
    BloomFilter = "bloom.filter",
    NatsMessageDigest = "nats.message.digest",
    JobSubscriberClientId = "job.subscriber.client_id",
    ParentIndex = "parent.index",
    KeycloakOidcPkce = "keycloak.oidc.pkce",
    KeycloakUser = "keycloak.user",
    UserEnrolledCourses = "user.enrolled-courses",
    UserProfileLocked = "user.profile-locked",
    EnrollmentMilestones = "enrollment.milestones",
    Milestone = "milestone",
    MilestoneTask = "milestone.task",
    MilestoneTaskProgress = "milestone.task.progress",
    CodingProblemProgress = "coding.problem.progress",
    CreditUsage = "credit.usage",
    CourseMindMap = "course.mind-map",
    /** AI ping mount-key health snapshots keyed by provider then API key. */
    AiPingKeyStatus = "ai.ping.key-status",
    /** AI per-model latency probe snapshots keyed by model name. */
    AiModelLatency = "ai.model.latency",
    /** Cached AI Lab playground run output, keyed by playground + user + input hash. */
    AiLabRun = "ai-lab.run",
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