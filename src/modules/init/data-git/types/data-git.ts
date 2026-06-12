import type {
    Octokit,
} from "octokit"

/** One retained commit snapshot recorded in the data-sources manifest. */
export interface SnapshotManifestEntry {
    /** Commit SHA — also the snapshot directory name under the data-sources root. */
    sha: string
    /** ISO timestamp the snapshot was pulled (for diagnostics + ordering ties). */
    pulledAt: string
}

/**
 * Ordered list of retained snapshots; the LAST entry is the newest the app
 * seeded from, and the baseline the next pull diffs against.
 */
export interface SnapshotManifest {
    /** Snapshots in pull order (oldest first, newest last). */
    snapshots: Array<SnapshotManifestEntry>
}

/** Result of resolving the remote data repo into a commit snapshot. */
export interface EnsureDataGitResult {
    /** True when the remote moved and a new snapshot was extracted; false when already up to date. */
    changed: boolean
    /** Remote commit SHA this run resolved to (the new snapshot's directory name). */
    sha: string
    /** Newest snapshot SHA before this run; empty when no prior snapshot exists. */
    previousSha: string
    /**
     * Snapshot-relative paths that differ between the previous snapshot and the
     * new one (filesystem diff). Only meaningful when `diffAvailable` is true.
     */
    changedPaths: Array<string>
    /**
     * True when a reliable diff was computed (a previous snapshot existed to
     * compare against). False on first boot — callers must full-reseed.
     */
    diffAvailable: boolean
    /**
     * Absolute path of the snapshot to seed from (`<datasourcesRoot>/<sha>`), or
     * `null` when nothing is available. The snapshot is committed to the manifest
     * (and pruned) only after a successful seed.
     */
    snapshotRoot: string | null
    /** Absolute path of the data-sources root holding every snapshot + the manifest. */
    datasourcesRoot: string
    /** Temp directory holding the downloaded tarball; removed during cleanup. */
    tempDir: string | null
}

/** Params for downloading the repo tarball and extracting it into a staging dir. */
export interface DownloadAndExtractParams {
    /** Authenticated GitHub client. */
    octokit: Octokit
    /** Repository owner (GitHub org or user). */
    owner: string
    /** Repository name. */
    repo: string
    /** Resolved git ref (branch name) to download. */
    ref: string
    /** Sub-directory inside the repo whose contents map to the data root; empty means the repo root. */
    subdir: string
}

/** Result of downloading + extracting the repo tarball into a staging dir. */
export interface DownloadAndExtractResult {
    /** Temp directory holding the extracted tree; caller removes it after use. */
    tempDir: string
    /** Absolute path of the content root inside the staging tree (subdir-aware). */
    stagingRoot: string
    /** Number of top-level entries extracted. */
    entryCount: number
}
