import {
    promises as fs,
} from "fs"
import {
    extname,
    join,
    resolve,
} from "path"
import {
    Injectable,
    Logger,
    OnModuleInit,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    S3BuildService,
    S3BucketService,
    S3Provider,
    S3UploadService,
    S3_ASSETS_PREFIX,
} from "@modules/s3"
import {
    ASSET_CONTENT_TYPE_BY_EXTENSION,
    ASSET_DEFAULT_CONTENT_TYPE,
} from "./constants"
import type {
    SyncAssetsResult,
    SyncedAsset,
} from "./types"

/**
 * Syncs local static brand assets (logos, etc.) from the on-disk assets folder
 * up to the MinIO bucket on boot, so the frontend can reference them by stable,
 * anonymously-readable public URLs.
 *
 * The source folder is configured via `envConfig().assets.dir` (default `.assets`)
 * and every file is uploaded under the `assets/` object-key prefix, which the
 * bucket policy keeps publicly readable.
 *
 * @example
 * // runs automatically on module init; can also be invoked manually:
 * const { assets } = await assetsService.sync()
 */
@Injectable()
export class AssetsService implements OnModuleInit {
    /** Scoped logger for boot-time asset sync diagnostics. */
    private readonly logger = new Logger(AssetsService.name)

    /**
     * Constructor.
     * @param s3UploadService - Uploads object buffers to the configured S3 providers.
     * @param s3BuildService - Builds public object URLs for uploaded keys.
     * @param s3BucketService - Applies the bucket policy that keeps public prefixes readable.
     */
    constructor(
        private readonly s3UploadService: S3UploadService,
        private readonly s3BuildService: S3BuildService,
        private readonly s3BucketService: S3BucketService,
    ) { }

    /**
     * Lifecycle hook: run a single asset sync pass when the module initializes.
     * Failures are swallowed (logged) so a transient MinIO outage never blocks boot.
     */
    async onModuleInit(): Promise<void> {
        try {
            // push every local asset to the bucket once at startup
            const { assets } = await this.sync()
            // surface a concise summary so ops can confirm the public URLs are live
            this.logger.log(`Synced ${assets.length} asset(s) to MinIO under "${S3_ASSETS_PREFIX}/"`)
        } catch (error) {
            // never crash the app over a non-critical static-asset sync
            this.logger.error(
                `Asset sync failed: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    /**
     * Upload every file in the local assets folder to MinIO under the public
     * `assets/` prefix and return the resulting public URLs.
     *
     * @returns The list of synced assets with their final keys + public URLs.
     */
    async sync(): Promise<SyncAssetsResult> {
        // target bucket lives on MinIO (the public-read provider in this stack)
        const bucket = envConfig().s3.minio.bucket
        // resolve the source folder relative to the process working directory
        const dir = resolve(process.cwd(),
            envConfig().assets.dir)

        // bail out quietly when the folder is absent (e.g. a deployment without assets)
        const dirExists = await this.directoryExists(dir)
        if (!dirExists) {
            this.logger.warn(`Assets directory "${dir}" not found — skipping asset sync`)
            return {
                assets: [],
            }
        }

        // make sure the public prefixes (incl. assets/*) are anonymously readable before uploading
        await this.s3BucketService.ensurePublicReadPrefixes(bucket)

        // read the folder once, keeping only regular files (one level deep)
        const entries = await fs.readdir(dir,
            {
                withFileTypes: true,
            })
        const assets = Array<SyncedAsset>()

        for (const entry of entries) {
            // skip nested directories — only flat asset files are synced
            if (!entry.isFile()) {
                continue
            }

            // derive the content type from the extension so browsers render inline
            const fileName = entry.name
            const extension = extname(fileName).toLowerCase()
            const contentType = ASSET_CONTENT_TYPE_BY_EXTENSION[extension] ?? ASSET_DEFAULT_CONTENT_TYPE

            // read the raw bytes to upload as an object body
            const buffer = await fs.readFile(join(dir,
                fileName))

            // namespace the object under the public assets prefix, preserving the file name
            const key = `${S3_ASSETS_PREFIX}/${fileName}`

            // upload to MinIO (overwrites if present — sync is idempotent for small static files)
            await this.s3UploadService.buffer({
                name: key,
                buffer,
                acl: "public-read",
                provider: S3Provider.Minio,
                contentType,
            })

            // compute the stable public URL the frontend / seed link can reference
            const url = this.s3BuildService.buildPublicObjectUrl({
                key,
                provider: S3Provider.Minio,
            })

            // record the synced asset and log its public URL for ops visibility
            assets.push({
                fileName,
                key,
                url,
            })
            this.logger.log(`Synced asset "${fileName}" -> ${url}`)
        }

        return {
            assets,
        }
    }

    /**
     * Whether the given filesystem path exists and is a directory.
     * @param dir - Absolute path to test.
     * @returns True when the path resolves to a directory.
     */
    private async directoryExists(dir: string): Promise<boolean> {
        try {
            // stat throws (ENOENT) when the path is missing — caught below as "not a directory"
            const stats = await fs.stat(dir)
            return stats.isDirectory()
        } catch {
            // any stat failure means the directory is unusable for syncing
            return false
        }
    }
}
