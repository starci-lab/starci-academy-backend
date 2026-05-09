import {
    envConfig 
} from "@modules/env"
import {
    CacheKey 
} from "./enums"
import type {
    BloomFilterCacheResult,
    CourseEnrollmentCacheResult,
    CourseEnrollmentCountCacheResult,
    EnrollmentMilestonesCacheResult,
    JobSubscriberClientIdCacheResult,
    KeycloakUserCacheResult,
    ParentIndexCacheResult,
    KeycloakOidcPkceCacheResult,
} from "./types"

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
}
