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
