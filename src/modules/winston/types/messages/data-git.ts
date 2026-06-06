/** Message for when the data-git bootstrap starts resolving the remote ref. */
export interface DataGitBootstrapStartedMessage {
    /** Repository owner (GitHub org or user). */
    owner: string
    /** Repository name. */
    repo: string
    /** Git ref (branch name) being resolved; empty means the repo default branch. */
    ref: string
}

/** Message for when the remote data repo is already in sync with the local marker. */
export interface DataGitBootstrapUpToDateMessage {
    /** Repository owner (GitHub org or user). */
    owner: string
    /** Repository name. */
    repo: string
    /** Resolved git ref (branch name) that was checked. */
    ref: string
    /** Commit SHA shared by the remote ref and the local marker. */
    sha: string
}

/** Message for when the data repo tarball was downloaded and extracted. */
export interface DataGitBootstrapUpdatedMessage {
    /** Repository owner (GitHub org or user). */
    owner: string
    /** Repository name. */
    repo: string
    /** Resolved git ref (branch name) that was downloaded. */
    ref: string
    /** Previous commit SHA from the local marker; empty on first bootstrap. */
    previousSha: string
    /** New commit SHA written to the local marker after extraction. */
    newSha: string
    /** Number of top-level entries replaced in the data root. */
    entryCount: number
    /** Absolute path of the data root the repo was extracted into. */
    checkoutRoot: string
}

/** Message describing how this boot's seed/sync scope was narrowed from the diff. */
export interface DataGitDiffScopedMessage {
    /** True when the diff could not be scoped and a full reseed was used instead. */
    fullReseed: boolean
    /** Number of courses kept in the narrowed scope. */
    courseCount: number
    /** Total number of module order-indexes kept across all courses. */
    moduleCount: number
    /** Number of standalone domains (cv/foundations/…) kept in the narrowed scope. */
    domainCount: number
    /** Effective scope mode resolved for this boot ("all" / "diff" / "none"). */
    scope: string
}

/** Message for when the data-git bootstrap fails to fetch or extract. */
export interface DataGitBootstrapFailedMessage {
    /** Repository owner (GitHub org or user). */
    owner: string
    /** Repository name. */
    repo: string
    /** Git ref (branch name) being resolved; empty means the repo default branch. */
    ref: string
    /** Exception code when available. */
    errorCode?: string
    /** Human-readable failure reason. */
    errorMessage: string
    /** Stack trace when the error is an `Error`. */
    errorStack?: string
}
