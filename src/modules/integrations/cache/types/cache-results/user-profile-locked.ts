/**
 * Cached profile-lock flag for one user (one key per user). True when the
 * profile is locked (only the owner sees full content). Rebuilt from the source
 * on miss and dropped on profile update (del-on-write) so the visibility check
 * never goes stale.
 */
export type UserProfileLockedCacheResult = boolean
