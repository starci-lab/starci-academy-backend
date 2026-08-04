import {
    envConfig
} from "@modules/env"
import {
    CacheKey
} from "../enums"
import type {
    BloomFilterCacheResult,
    UserEnrolledCoursesCacheResult,
    UserProfileLockedCacheResult,
    EnrollmentMilestonesCacheResult,
    JobSubscriberClientIdCacheResult,
    KeycloakUserCacheResult,
    MilestoneTaskProgressCacheResult,
    ParentIndexCacheResult,
    KeycloakOidcPkceCacheResult,
    CodingProblemProgressCacheResult,
    CreditUsageCacheResult,
    CourseMindMapCacheResult,
    AiPingKeyStatusCacheResult,
    AiModelLatencyCacheResult,
    EntityLabelCacheResult,
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
    [CacheKey.UserEnrolledCourses]: {
        ttl: envConfig().cache.ttl.userEnrolledCourses,
        cacheResult: [] as UserEnrolledCoursesCacheResult,
    },
    [CacheKey.UserProfileLocked]: {
        ttl: envConfig().cache.ttl.userProfileLocked,
        cacheResult: false as UserProfileLockedCacheResult,
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
    [CacheKey.CodingProblemProgress]: {
        ttl: envConfig().cache.ttl.codingProblemProgress,
        cacheResult: {
        } as CodingProblemProgressCacheResult,
    },
    [CacheKey.CreditUsage]: {
        ttl: envConfig().cache.ttl.creditUsage,
        cacheResult: {
        } as CreditUsageCacheResult,
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
    [CacheKey.AiModelLatency]: {
        ttl: envConfig().cache.ttl.aiModelLatency,
        cacheResult: {
        } as AiModelLatencyCacheResult,
    },
    [CacheKey.EntityLabel]: {
        ttl: envConfig().cache.ttl.entityLabel,
        // simple label string — store the resolved display text directly
        cacheResult: "" as EntityLabelCacheResult,
    },
}
