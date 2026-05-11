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