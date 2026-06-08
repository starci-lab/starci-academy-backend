import type {
    Octokit,
} from "octokit"

/** Result of resolving the remote data repo into a staging copy. */
export interface EnsureDataGitResult {
    /** True when the remote moved and a staging copy was extracted; false when already up to date. */
    changed: boolean
    /** Remote commit SHA this run resolved to. */
    sha: string
    /** SHA the local root was pinned to before this run; empty on first bootstrap. */
    previousSha: string
    /**
     * Repo-relative paths changed between `previousSha` and `sha`.
     *
     * Only meaningful when `diffAvailable` is true. Drives selective seeding.
     */
    changedPaths: Array<string>
    /**
     * True when a reliable file-level diff was computed (had a previous SHA and
     * the compare succeeded). False on first boot or when the compare failed —
     * callers must then fall back to a full reseed.
     */
    diffAvailable: boolean
    /**
     * Absolute path of the freshly-extracted staging copy to seed from, or
     * `null` when nothing was downloaded (up to date). Seed/sync read from here;
     * it is materialized into {@link checkoutRoot} only after a successful seed.
     */
    stagingRoot: string | null
    /** Temp directory holding the staging copy; removed during commit/cleanup. */
    tempDir: string | null
    /** Absolute path of the real data root (`.contexts`) to materialize into. */
    checkoutRoot: string
}

/** Params for resolving the file-level diff between two commits. */
export interface ResolveChangedPathsParams {
    /** Authenticated GitHub client. */
    octokit: Octokit
    /** Repository owner (GitHub org or user). */
    owner: string
    /** Repository name. */
    repo: string
    /** Baseline commit SHA (from the local marker); empty on first bootstrap. */
    previousSha: string
    /** New commit SHA just extracted. */
    newSha: string
}

/** Result of resolving the file-level diff between two commits. */
export interface ResolveChangedPathsResult {
    /** Repo-relative paths changed between the two commits. */
    changedPaths: Array<string>
    /** True when the compare succeeded and the path list is trustworthy. */
    diffAvailable: boolean
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
