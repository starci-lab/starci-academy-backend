import {
    envConfig
} from "@modules/env"
import {
    CacheKey
} from "../enums"
import type {
    BloomFilterCacheResult,
    CourseEnrollmentCacheResult,
    CourseEnrollmentCountCacheResult,
    EnrollmentMilestonesCacheResult,
    JobSubscriberClientIdCacheResult,
    KeycloakUserCacheResult,
    MilestoneTaskProgressCacheResult,
    ParentIndexCacheResult,
    KeycloakOidcPkceCacheResult,
    ChallengeSubmissionProgressCacheResult,
    CreditUsageCacheResult,
    CourseLeaderboardCacheResult,
    CourseMindMapCacheResult,
    AiPingKeyStatusCacheResult,
    ContentViewCountCacheResult,
} from "../types"

/**
 * Map of cache key to TTL and default cache result shape.
 * Used by CacheService for get/set TTL and type inference.
 */
export const configMap = {
    [CacheKey.BloomFilter]: {
        ttl: envConfig().cache.ttl.bloomFilter,
        cacheResult: {
        } as BloomFilterCacheResult,
    },
    [CacheKey.NatsMessageDigest]: {
        ttl: envConfig().cache.ttl.natsMessageDigest,
        cacheResult: true,
    },
    [CacheKey.JobSubscriberClientId]: {
        ttl: envConfig().cache.ttl.jobSubscriberClientId,
        cacheResult: {
        } as JobSubscriberClientIdCacheResult,
    },
    [CacheKey.ParentIndex]: {
        ttl: envConfig().cache.ttl.parentIndex,
        cacheResult: {
        } as ParentIndexCacheResult,
    },
    [CacheKey.KeycloakOidcPkce]: {
        ttl: envConfig().cache.ttl.keycloakOidcPkce,
        cacheResult: {
        } as KeycloakOidcPkceCacheResult,
    },
    [CacheKey.KeycloakUser]: {
        ttl: envConfig().cache.ttl.keycloakUser,
        cacheResult: {
        } as KeycloakUserCacheResult,
    },
    [CacheKey.CourseEnrollment]: {
        ttl: envConfig().cache.ttl.courseEnrollment,
        cacheResult: true as CourseEnrollmentCacheResult,
    },
    [CacheKey.CourseEnrollmentCount]: {
        ttl: envConfig().cache.ttl.courseEnrollmentCount,
        cacheResult: 0 as CourseEnrollmentCountCacheResult,
    },
    [CacheKey.EnrollmentMilestones]: {
        ttl: envConfig().cache.ttl.enrollmentMilestones,
        cacheResult: [] as EnrollmentMilestonesCacheResult,
    },
    [CacheKey.Milestone]: {
        ttl: envConfig().cache.ttl.enrollmentMilestones,
        cacheResult: {
        } as Record<string, unknown>,
    },
    [CacheKey.MilestoneTask]: {
        ttl: envConfig().cache.ttl.enrollmentMilestones,
        cacheResult: {
        } as Record<string, unknown>,
    },
    [CacheKey.MilestoneTaskProgress]: {
        ttl: envConfig().cache.ttl.milestoneTaskProgress,
        cacheResult: {
        } as MilestoneTaskProgressCacheResult,
    },
    [CacheKey.ChallengeSubmissionProgress]: {
        ttl: envConfig().cache.ttl.challengeSubmissionProgress,
        cacheResult: {
        } as ChallengeSubmissionProgressCacheResult,
    },
    [CacheKey.CreditUsage]: {
        ttl: envConfig().cache.ttl.creditUsage,
        cacheResult: {
        } as CreditUsageCacheResult,
    },
    [CacheKey.CourseLeaderboard]: {
        ttl: envConfig().cache.ttl.courseLeaderboard,
        cacheResult: {
        } as CourseLeaderboardCacheResult,
    },
    [CacheKey.CourseLeaderboardDebounce]: {
        ttl: envConfig().cache.ttl.courseLeaderboardDebounce,
        cacheResult: true,
    },
    [CacheKey.CourseMindMap]: {
        ttl: envConfig().cache.ttl.courseMindMap,
        cacheResult: {
            nodes: [],
            edges: [],
        } as CourseMindMapCacheResult,
    },
    [CacheKey.AiPingKeyStatus]: {
        ttl: envConfig().cache.ttl.aiPingKeyStatus,
        cacheResult: {
        } as AiPingKeyStatusCacheResult,
    },
    [CacheKey.ContentViewCount]: {
        ttl: envConfig().cache.ttl.contentViewCount,
        // simple numeric count — store as a number directly
        cacheResult: 0 as ContentViewCountCacheResult,
    },
}
