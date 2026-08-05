/**
 * Manifest file (under the data-sources root) that records the retained commit
 * snapshots in pull order -- its tail is the newest snapshot the app seeded from.
 */
export const DATA_GIT_MANIFEST_FILE = "manifest.json"

/**
 * Max number of commit snapshots kept under the data-sources root. On each new
 * pull the oldest snapshots beyond this count are pruned (dir + manifest entry).
 */
export const DATA_GIT_MAX_SNAPSHOTS = 4

/** Prefix for the OS temp directory used to download and extract the repo tarball. */
export const DATA_GIT_TEMP_PREFIX = "data-git-"
