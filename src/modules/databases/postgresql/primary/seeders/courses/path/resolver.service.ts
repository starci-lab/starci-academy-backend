import {
    Injectable
} from "@nestjs/common"
import {
    ContextType,
    envConfig
} from "@modules/env"
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
     * Absolute path to `contents/` for the given course and module index.
     *
     * @param relativePath - Relative path to the file
     * @returns Indexes of the files in the context
     */
    public async filePaths(
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
                        const rawPaths = await fs.readdir(
                            `${context.path}/${relativePath}`,
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
                                key: `courses/${relativePath}`,
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