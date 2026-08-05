import {
    promises as fs,
} from "fs"
import {
    extname,
    join,
    relative,
    resolve,
    sep,
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
    getRuntimeContextRoot,
} from "@modules/filesystem"
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
    AssetFileEntry,
    SyncAssetsResult,
    SyncedAsset,
} from "./types"

@Injectable()
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

        // source the assets from the git-shipped data root first (so a deploy
        // ships its assets with the content repo), else the local on-disk folder
        const dir = await this.resolveAssetsDir()
        if (!dir) {
            this.logger.warn("No assets directory found — skipping asset sync")
            return {
                assets: [],
            }
        }

        // make sure the public prefixes (incl. assets/*) are anonymously readable before uploading
        await this.s3BucketService.ensurePublicReadPrefixes(bucket)

        // walk the tree, preserving each file's path relative to the assets root so
        // nested folders (e.g. badges/achievements/*) keep their structure in the key
        const files = await this.collectFiles(dir,
            dir)
        const assets = Array<SyncedAsset>()

        for (const file of files) {
            // derive the content type from the extension so browsers render inline
            const extension = extname(file.relPath).toLowerCase()
            const contentType = ASSET_CONTENT_TYPE_BY_EXTENSION[extension] ?? ASSET_DEFAULT_CONTENT_TYPE

            // read the raw bytes to upload as an object body
            const buffer = await fs.readFile(file.absPath)

            // forward-slash object key under the public assets prefix, preserving sub-paths
            const key = `${S3_ASSETS_PREFIX}/${file.relPath.split(sep).join("/")}`

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
                fileName: file.relPath,
                key,
                url,
            })
            this.logger.log(`Synced asset "${file.relPath}" -> ${url}`)
        }

        return {
            assets,
        }
    }

    /**
     * First existing assets source: the git-sourced data snapshot root
     * (`<runtimeRoot>/assets`, shipped with the content repo) else the local
     * on-disk fallback (`envConfig().assets.dir`, default `.assets`).
     *
     * @returns the assets directory path, or null when neither exists.
     */
    private async resolveAssetsDir(): Promise<string | null> {
        const root = getRuntimeContextRoot()
        const candidates = [
            root ? join(root,
                "assets") : null,
            resolve(process.cwd(),
                envConfig().assets.dir),
        ].filter((path): path is string => Boolean(path))
        for (const candidate of candidates) {
            if (await this.directoryExists(candidate)) {
                return candidate
            }
        }
        return null
    }

    /**
     * Recursively collect every regular file under `dir`, tagging each with its
     * path relative to `root` (so the upload key preserves the folder structure).
     *
     * @param dir - directory currently being walked.
     * @param root - the assets root, for computing relative keys.
     * @returns the flat list of files with absolute + relative paths.
     */
    private async collectFiles(
        dir: string,
        root: string,
    ): Promise<Array<AssetFileEntry>> {
        const out: Array<AssetFileEntry> = []
        const entries = await fs.readdir(dir,
            {
                withFileTypes: true,
            })
        for (const entry of entries) {
            const absPath = join(dir,
                entry.name)
            if (entry.isDirectory()) {
                // recurse into sub-folders (badges/, etc.)
                out.push(...await this.collectFiles(absPath,
                    root))
            } else if (entry.isFile()) {
                out.push({
                    absPath,
                    relPath: relative(root,
                        absPath),
                })
            }
        }
        return out
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
