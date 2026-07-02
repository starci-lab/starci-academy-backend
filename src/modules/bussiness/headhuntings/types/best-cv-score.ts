/** Params for computing a user's best-ever CV score. */
export interface GetBestCvScoreParams {
    /** Id of the user whose CV attempts to scan; `null`/`undefined` = anonymous viewer. */
    userId?: string | null
}
