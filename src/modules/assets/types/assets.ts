/** One regular file collected from the local assets folder for upload. */
export interface AssetFileEntry {
    /** Absolute filesystem path of the file. */
    absPath: string
    /** Path relative to the assets root, used as the upload key suffix. */
    relPath: string
}

/** One asset that was synced from the local folder up to S3/MinIO. */
export interface SyncedAsset {
    /** Source file name as it appears in the local assets folder (e.g. `nestjs.png`). */
    fileName: string
    /** Final object key in the bucket (e.g. `assets/nestjs.png`). */
    key: string
    /** Public, anonymously-readable URL of the uploaded object. */
    url: string
}

/** Result of one full assets sync pass. */
export interface SyncAssetsResult {
    /** Every asset that was uploaded (or re-uploaded) in this pass. */
    assets: Array<SyncedAsset>
}
