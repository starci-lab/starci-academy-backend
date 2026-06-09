import {
    Injectable
} from "@nestjs/common"
import {
    ContextType,
    envConfig
} from "@modules/env"
import {
    getRuntimeContextRoot,
} from "@modules/filesystem"
import fs from "fs/promises"
import {
    S3Provider,
    S3ReadService
} from "@modules/s3"
import type {
    ResolvedFilePath,
} from "./types"
/**
 * Resolves indexed content folders under a module’s `contents/` directory (`{index}-{slug}` or legacy `{index}`).
 */
@Injectable()
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
                    orderIndex: parseInt(orderIndex),
                    displayId,
                }
            }
        )
    }

    /**
     * Lists raw entry names (files and directories) under `baseDir/relativePath` WITHOUT the
     * `{index}-{slug}` filter — used for non-indexed trees such as `.e2e/<lang>/flow-*.md`.
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
            const contexts = envConfig().contexts
                .filter(context => context.enabled)
                .sort((prev, next) => prev.priority - next.priority)

            for (const context of contexts) {
                switch (context.type) {
                /** List entries from the filesystem. */
                case ContextType.Filesystem: {
                    try {
                        const root = getRuntimeContextRoot() ?? context.path
                        const rawPaths = await fs.readdir(
                            `${root}/${baseDir}/${relativePath}`,
                        )
                        if (rawPaths.length > 0) {
                            return rawPaths
                        }
                    } catch {
                        // do nothing
                    }
                    break
                }
                /** List entries from S3. */
                case ContextType.S3: {
                    try {
                        const rawPaths = await this.s3ReadService.list(
                            {
                                key: `${baseDir}/${relativePath}`,
                                provider: context.provider as S3Provider,
                            },
                        )
                        if (rawPaths.length > 0) {
                            return rawPaths
                        }
                    } catch {
                        // do nothing
                    }
                    break
                }
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
            const contexts = envConfig().contexts
                .filter(context => context.enabled)
                .sort((prev, next) => prev.priority - next.priority)

            for (const context of contexts) {
                switch (context.type) {
                /** Read the files from the filesystem. */
                case ContextType.Filesystem: {
                    try {
                        // seed from the staging root when set, else the context path
                        const root = getRuntimeContextRoot() ?? context.path
                        const rawPaths = await fs.readdir(
                            `${root}/${baseDir}/${relativePath}`,
                        )
                        const paths = this.filterIndexed(rawPaths)
                        if (paths.length > 0) {
                            return this.mapToResolvedFilePaths(
                                relativePath,
                                paths,
                            )
                        }
                    } catch {
                        // do nothing
                    }
                    break
                }
                /** Read the files from S3. */
                case ContextType.S3: {
                    try {
                        const rawPaths = await this.s3ReadService.list(
                            {
                                key: `${baseDir}/${relativePath}`,
                                provider: context.provider as S3Provider,
                            },
                        )
                        const paths = this.filterIndexed(rawPaths)
                        if (paths.length > 0) {
                            return this.mapToResolvedFilePaths(
                                relativePath,
                                paths,
                            )
                        }
                    } catch {
                        // do nothing
                    }
                    break
                }
                }
            }
            return []
        } catch {
            return []
        }
    }
}