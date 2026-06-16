/** Result of reading a foundations file from the mounted data directory. */
export interface ReadFoundationsFileResult {
    /** Absolute filesystem path the file was read from. */
    absolutePath: string
    /** Raw file contents. */
    buffer: Buffer
}
