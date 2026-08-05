/** Params for {@link GithubRepoImportService.fetchFilesInBatches}. */
export interface FetchFilesInBatchesParams {
    /** Repo owner (GitHub org/user). */
    owner: string
    /** Repo name. */
    repo: string
    /** Git ref (branch/tag/sha) to fetch from. */
    ref: string
    /** File paths to fetch, relative to the repo root. */
    paths: Array<string>
}

/** Params for {@link GithubRepoImportService.fetchRawFile}. */
export interface FetchRawFileParams {
    /** Repo owner (GitHub org/user). */
    owner: string
    /** Repo name. */
    repo: string
    /** Git ref (branch/tag/sha) to fetch from. */
    ref: string
    /** File path to fetch, relative to the repo root. */
    path: string
}
