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
    CourseEnrollment = "course.enrollment",
    CourseEnrollmentCount = "course.enrollment.count",
    EnrollmentMilestones = "enrollment.milestones",
    Milestone = "milestone",
    MilestoneTask = "milestone.task",
    MilestoneTaskProgress = "milestone.task.progress",
    ChallengeSubmissionProgress = "challenge.submission.progress",
    CodingProblemProgress = "coding.problem.progress",
    CreditUsage = "credit.usage",
    CourseLeaderboard = "course.leaderboard",
    CourseLeaderboardDebounce = "course.leaderboard.debounce",
    CourseMindMap = "course.mind-map",
    /** AI ping mount-key health snapshots keyed by provider then API key. */
    AiPingKeyStatus = "ai.ping.key-status",
    /** Number of users who have marked a content as read, keyed by contentId. */
    ContentViewCount = "content.view-count",
    /** Cached AI Lab playground run output, keyed by playground + user + input hash. */
    AiLabRun = "ai-lab.run",
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