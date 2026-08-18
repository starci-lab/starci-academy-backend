/** The start/end SQL callbacks that mark asset state around an encode step. */
export type FilenameProcessCallbackQueries = {
    readonly queryAtStart: readonly [string, unknown[]]
    readonly queryAtEnd: readonly [string, unknown[]]
}

/**
 * One source video handed to the process-video worker. `url` is the download;
 * start/end SQL callbacks mark asset state so a crash mid-encode does not leave
 * the row looking finished.
 */
export type FilenameProcessData = {
    readonly assetId: string
    readonly filename: string
    /** Full S3 URL to download the source video from. */
    readonly url: string
    readonly callbackQueries: FilenameProcessCallbackQueries
}
