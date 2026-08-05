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
    OnModuleInit,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    getRuntimeContextRoot,
} from "@modules/filesystem/utils/mount-seed"
import {
    S3_ASSETS_PREFIX,
} from "@modules/integrations/s3/constants/s3"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3BucketService,
} from "@modules/integrations/s3/s3-bucket.service"
import {
    S3BuildService,
} from "@modules/integrations/s3/s3-build.service"
import {
    S3UploadService,
} from "@modules/integrations/s3/s3-upload.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ASSET_CONTENT_TYPE_BY_EXTENSION,
    ASSET_DEFAULT_CONTENT_TYPE,
} from "./constants/assets"
import type {
    AssetFileEntry,
    SyncAssetsResult,
    SyncedAsset,
} from "./types/assets"

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
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Lifecycle hook: run a single asset sync pass when the module initializes.
     * Failures are swallowed (logged) so a transient MinIO outage never blocks boot.
     */
    async onModuleInit(): Promise<void> {
        try {
            const { assets } = await this.sync()
            this.winstonService.log(WinstonLog.InitPhaseCompleted,
                {
                    op: "init.assets.synced",
                    count: assets.length,
                })
        } catch (error) {
            this.winstonService.log(WinstonLog.InitPhaseFailed,
                {
                    op: "init.assets.sync-failed",
                    error: error instanceof Error ? error.message : String(error),
                })
        }
    }

    /**
     * Upload every file in the local assets folder to MinIO under the public
     * `assets/` prefix and return the resulting public URLs.
     *
     * @returns The list of synced assets with their final keys + public URLs.
     */
    async sync(): Promise<SyncAssetsResult> {
        const bucket = envConfig().s3.minio.bucket

        const dir = await this.resolveAssetsDir()
        if (!dir) {
            this.winstonService.log(WinstonLog.InitPhaseFailed,
                {
                    op: "init.assets.dir-missing",
                })
            return {
                assets: [],
            }
        }

        await this.s3BucketService.ensurePublicReadPrefixes(bucket)

        const files = await this.collectFiles(dir,
            dir)
        const assets = Array<SyncedAsset>()

        for (const file of files) {
            const extension = extname(file.relPath).toLowerCase()
            const contentType = ASSET_CONTENT_TYPE_BY_EXTENSION[extension] ?? ASSET_DEFAULT_CONTENT_TYPE

            const buffer = await fs.readFile(file.absPath)

            const key = `${S3_ASSETS_PREFIX}/${file.relPath.split(sep).join("/")}`

            await this.s3UploadService.buffer({
                name: key,
                buffer,
                acl: "public-read",
                provider: S3Provider.Minio,
                contentType,
            })

            const url = this.s3BuildService.buildPublicObjectUrl({
                key,
                provider: S3Provider.Minio,
            })

            assets.push({
                fileName: file.relPath,
                key,
                url,
            })
            this.winstonService.log(WinstonLog.InitPhaseCompleted,
                {
                    op: "init.assets.file-synced",
                    meta: {
                        relPath: file.relPath,
                        url,
                    },
                })
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
            const stats = await fs.stat(dir)
            return stats.isDirectory()
        } catch {
            return false
        }
    }
}
