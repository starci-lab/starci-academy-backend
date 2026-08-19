import {
    Injectable
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    ContextType,
} from "@modules/platform/env/enums/context"
import {
    getRuntimeContextRoot,
} from "@modules/filesystem/utils/mount-seed"
import fs from "node:fs/promises"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import type {
    ResolvedFilePath,
} from "./types"

/** One entry of `envConfig().contexts` (filesystem or S3), ordered by resolution priority. */
type EnvContext = ReturnType<typeof envConfig>["contexts"][number]
@Injectable()
/**
 * Resolves indexed content folders under a module's `contents/` directory (`{index}-{slug}` or legacy `{index}`).
 */
export class PathResolverService {
    constructor(
        private readonly s3ReadService: S3ReadService,
    ) { }

    /**
     * Maps paths to resolved file paths.
     *
     * @param relativePath - Relative path to the file
     * @param paths - Paths to map
     * @returns Resolved file paths
     */
    /**
     * Keeps only entries that match the `{index}` or `{index}-{slug}` mount convention.
     * Drops placeholder files such as `.gitkeep`, `.DS_Store`, `README.md` placed by authors
     * to keep an otherwise empty folder under version control.
     */
    private filterIndexed(
        paths: Array<string>,
    ): Array<string> {
        return paths.filter((p) => /^\d+(-|$)/u.test(p))
    }

    private mapToResolvedFilePaths(
        relativePath: string,
        paths: Array<string>,
    ): Array<ResolvedFilePath> {
        return paths.map(
            (path) => {
                const orderIndex = path.split("-")[0]
                // we take the substring after the order index and remove the trailing slash
                const displayId = path.substring(orderIndex.length + 1)
                return {
                    relativePath: `${relativePath}/${path}`.replace(
                        /^\/+/u,
                        "",
                    ),
                    orderIndex: Number.parseInt(orderIndex),
                    displayId,
                }
            }
        )
    }

    /** Enabled contexts (filesystem/S3), ordered highest-priority first. */
    private enabledContextsByPriority(): Array<EnvContext> {
        return envConfig().contexts
            .filter(context => context.enabled)
            .sort((prev, next) => prev.priority - next.priority)
    }

    /**
     * Read raw entry names from one context (filesystem or S3), dispatching by
     * context type. `null` means the read failed or the context type is
     * unsupported -- the caller falls through to the next context either way.
     */
    private async readContextEntries(
        context: EnvContext,
        baseDir: string,
        relativePath: string,
    ): Promise<Array<string> | null> {
        switch (context.type) {
        case ContextType.Filesystem:
            return this.readFilesystemEntries(context,
                baseDir,
                relativePath)
        case ContextType.S3:
            return this.readS3Entries(context,
                baseDir,
                relativePath)
        default:
            return null
        }
    }

    /** Read raw entry names from the filesystem, or `null` when the directory is absent/unreadable. */
    private async readFilesystemEntries(
        context: EnvContext,
        baseDir: string,
        relativePath: string,
    ): Promise<Array<string> | null> {
        try {
            // seed from the staging root when set, else the context path
            const root = getRuntimeContextRoot() ?? context.path
            return await fs.readdir(
                `${root}/${baseDir}/${relativePath}`,
            )
        } catch {
            return null
        }
    }

    /** Read raw entry names from S3, or `null` when the listing fails. */
    private async readS3Entries(
        context: EnvContext,
        baseDir: string,
        relativePath: string,
    ): Promise<Array<string> | null> {
        try {
            return await this.s3ReadService.list(
                {
                    key: `${baseDir}/${relativePath}`,
                    provider: context.provider as S3Provider,
                },
            )
        } catch {
            return null
        }
    }

    /**
     * Lists raw entry names (files and directories) under `baseDir/relativePath` WITHOUT the
     * `{index}-{slug}` filter -- used for non-indexed trees such as `.e2e/<lang>/flow-*.md`.
     * Mirrors {@link filePaths}' context resolution (staging root / filesystem, then S3).
     *
     * @param baseDir - The base directory (context prefix, e.g. `"courses"`).
     * @param relativePath - Relative path under `baseDir`.
     * @returns Raw entry names (no path prefix), or `[]` when the directory is absent.
     */
    public async listRaw(
        baseDir: string,
        relativePath: string,
    ): Promise<Array<string>> {
        try {
            const contexts = this.enabledContextsByPriority()
            for (const context of contexts) {
                const rawPaths = await this.readContextEntries(context,
                    baseDir,
                    relativePath)
                if (rawPaths && rawPaths.length > 0) {
                    return rawPaths
                }
            }
            return []
        } catch {
            return []
        }
    }

    /**
     * Absolute path to `contents/` for the given course and module index.
     *
     * @param relativePath - Relative path to the file
     * @returns Indexes of the files in the context
     */
    public async filePaths(
        /** The base directory of the files. */
        baseDir: string,
        /** The relative path to the file. */
        relativePath: string,
    ): Promise<Array<ResolvedFilePath>> {
        try {
            const contexts = this.enabledContextsByPriority()
            for (const context of contexts) {
                const rawPaths = await this.readContextEntries(context,
                    baseDir,
                    relativePath)
                const paths = this.filterIndexed(rawPaths ?? [])
                if (paths.length > 0) {
                    return this.mapToResolvedFilePaths(
                        relativePath,
                        paths,
                    )
                }
            }
            return []
        } catch {
            return []
        }
    }
}
