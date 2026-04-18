export type FilenameProcessData = {
    readonly assetId: string
    readonly filename: string
    readonly callbackQueries: {
        readonly queryAtStart: readonly [string, any[]]
        readonly queryAtEnd: readonly [string, any[]]
    }
}
