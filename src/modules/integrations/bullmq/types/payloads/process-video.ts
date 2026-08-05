export type FilenameProcessData = {
    readonly assetId: string
    readonly filename: string
    /** Full S3 URL to download the source video from. */
    readonly url: string
    readonly callbackQueries: {
        readonly queryAtStart: readonly [string, unknown[]]
        readonly queryAtEnd: readonly [string, unknown[]]
    }
}
