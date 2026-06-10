import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    ContentEntity,
} from "@modules/databases"
import {
    type EntityManager,
    IsNull,
    Not,
    MoreThan,
} from "typeorm"
import {
    S3Provider,
    S3UploadService,
    S3NameResolverService,
    S3BucketService,
} from "@modules/s3"
import {
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
} from "@modules/mixin"
import type {
    SynchronizerSyncScope,
} from "../../types"
import {
    shouldSyncContentEntity,
} from "../../utils"
import * as fsp from "fs/promises"
import * as path from "path"

/** Directory names to skip when walking the repo tree. */
const SKIP_DIRS = new Set([
    "node_modules",
    ".git",
    "__pycache__",
    ".docker",
    "dist",
    "build",
    ".next",
    "target",
    "bin",
    "obj",
])

/** File extensions treated as text (safe to read as UTF-8 for Sandpack). */
const TEXT_EXTENSIONS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".jsonc",
    ".md",
    ".mdx",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".html",
    ".htm",
    ".yml",
    ".yaml",
    ".env",
    ".env.example",
    ".gitignore",
    ".gitkeep",
    ".npmignore",
    ".txt",
    ".sh",
    ".bash",
    ".go",
    ".java",
    ".cs",
    ".py",
    ".rs",
    ".cpp",
    ".c",
    ".h",
    ".hpp",
    ".xml",
    ".toml",
    ".lock",
    ".proto",
    ".graphql",
    ".gql",
    ".sql",
    ".conf",
    ".config",
    ".tf",
    ".hcl",
    ".dockerfile",
    ".Dockerfile",
])

/**
 * Repo synchronizer — reads `.repo/` code directories for sandbox lessons and
 * uploads per-lesson Sandpack file trees to CDN, replacing direct GitHub API calls.
 */
@Injectable()
export class RepoSynchronizerService {

    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3UploadService: S3UploadService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly s3BucketService: S3BucketService,
    ) { }

    /**
     * Sync sandbox lesson code trees to CDN within the given scope.
     *
     * Queries every `ContentEntity` with `isSandbox=true` + non-null `githubBaseUrl`
     * and `githubDir`, applies module-scope filtering, then walks the matching local
     * `.repo/` subtree and uploads the Sandpack file map as plain JSON to
     * `repo/{repoName}/{githubDir}.json` (read by the FE with a raw JSON.parse).
     */
    async sync(scope: SynchronizerSyncScope): Promise<void> {
        const start = this.dayjsService.now()

        // Ensure all public prefixes (repo/* + assets/*) are anonymously readable in Minio so
        // non-premium sandbox lessons + brand assets can be fetched directly by the FE without
        // presigned URLs. Single bucket policy is enumerated centrally, so this never clobbers
        // the assets prefix even though the assets module applies the same policy on boot.
        await this.s3BucketService.ensurePublicReadPrefixes(
            envConfig().s3.minio.bucket,
        )

        let resumeEntityId: string | null = null
        while (true) {
            const content = await this.entityManager.findOne(ContentEntity,
                {
                    where: {
                        isSandbox: true,
                        githubBaseUrl: Not(IsNull()),
                        githubDir: Not(IsNull()),
                        ...(resumeEntityId ? {
                            id: MoreThan(resumeEntityId),
                        } : {
                        }),
                    },
                    relations: {
                        module: {
                            course: true,
                        },
                    },
                    order: {
                        id: "ASC",
                    },
                })
            if (!content) break

            if (!shouldSyncContentEntity(scope,
                content)) {
                resumeEntityId = content.id
                continue
            }

            const repoName = content.githubBaseUrl!.split("/").at(-1)!
            const localDir = path.join(
                process.cwd(),
                ".repo",
                repoName,
                content.githubDir!,
            )
            try {
                const files = await this.walkDir(localDir,
                    localDir)
                const key = this.s3NameResolverService.repo(repoName,
content.githubDir!)
                // Plain JSON (encoding: "json"), written as text directly so the FE
                // sandbox fetch reads the Sandpack file map with a raw JSON.parse.
                await this.s3UploadService.json({
                    acl: content.isPremium ? "private" : "public-read",
                    providers: [S3Provider.Minio],
                    name: key,
                    encoding: "json",
                    payload: files,
                })
                this.winstonService.log(
                    WinstonLog.RepoSynchronizerContentSynced,
                    {
                        contentId: content.id,
                        contentDisplayId: content.displayId,
                        key,
                        fileCount: Object.keys(files).length,
                    },
                )
            } catch (error) {
                this.winstonService.log(
                    WinstonLog.RepoSynchronizerContentSyncFailed,
                    {
                        contentId: content.id,
                        contentDisplayId: content.displayId,
                        errorMessage: error instanceof Error
                            ? error.message
                            : String(error),
                    },
                )
            }

            resumeEntityId = content.id
        }

        this.winstonService.log(
            WinstonLog.RepoSynchronizerSyncDone,
            {
                doneAt: this.dayjsService.now(),
                durationMs: this.dayjsService.now().diff(start),
            },
        )
    }

    /**
     * Recursively walk `dirPath` and collect text files as a Sandpack file map.
     * Keys are absolute-style paths relative to `baseDir` (e.g. `/src/App.tsx`).
     */
    private async walkDir(
        dirPath: string,
        baseDir: string,
    ): Promise<Record<string, { code: string }>> {
        const files: Record<string, { code: string }> = {
        }
        try {
            const entries = await fsp.readdir(dirPath,
                {
                    withFileTypes: true,
                })
            for (const entry of entries) {
                if (SKIP_DIRS.has(entry.name)) continue
                const fullPath = path.join(dirPath,
                    entry.name)
                if (entry.isDirectory()) {
                    const nested = await this.walkDir(fullPath,
                        baseDir)
                    Object.assign(files,
                        nested)
                } else {
                    const ext = path.extname(entry.name).toLowerCase()
                    if (ext && !TEXT_EXTENSIONS.has(ext)) continue
                    try {
                        const code = await fsp.readFile(fullPath,
                            "utf-8")
                        const relativePath = "/" + path
                            .relative(baseDir,
                                fullPath)
                            .replace(/\\/g,
                                "/")
                        files[relativePath] = {
                            code,
                        }
                    } catch {
                        // skip unreadable / binary files that slipped through
                    }
                }
            }
        } catch {
            // directory doesn't exist — return empty map
        }
        return files
    }
}
