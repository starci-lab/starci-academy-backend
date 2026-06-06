import type {
    Octokit,
} from "octokit"

/** Result of ensuring the local data root matches the remote data repo. */
export interface EnsureDataGitResult {
    /** True when the tarball was (re)downloaded and extracted; false when already up to date. */
    changed: boolean
    /** Commit SHA the local data root is now pinned to. */
    sha: string
    /** SHA the root was pinned to before this run; empty on first bootstrap. */
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

/** Params for downloading the repo tarball and extracting it over the data root. */
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
    /** Absolute path of the data root to extract into. */
    checkoutRoot: string
}
