/**
 * The type of context for course file loading.
 */
export enum ContextType {
    /**
     * The type of context for S3.
     */
    S3 = "s3",
    /**
     * The type of context for filesystem.
     */
    Filesystem = "filesystem",
}