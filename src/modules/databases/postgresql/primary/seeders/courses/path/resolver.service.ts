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

/**
 * Resolves indexed content folders under a module’s `contents/` directory (`{index}-{slug}` or legacy `{index}`).
 */
@Injectable()
export class PathResolverService {
    constructor(
        private readonly s3ReadService: S3ReadService,
    ) { }

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
        const contexts = envConfig().contexts
        for (const context of contexts) {
            switch (context.type) {
            /** Read the files from the filesystem. */
            case ContextType.Filesystem: {
                const paths = await fs.readdir(
                    `${context.path}/${relativePath}`,
                )
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
            /** Read the files from S3. */
            case ContextType.S3: {
                const paths = await this.s3ReadService.list(
                    {
                        key: `courses/${relativePath}`,
                        provider: context.provider as S3Provider,
                    },
                )
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
            }
        }
        return []
    }
}

/** The result of resolving a file path. */
export interface ResolvedFilePath {
    /** The relative path to the file. */
    relativePath: string
    /** The order index of the file. */
    orderIndex: number
    /** The display index of the file. */
    displayId: string
}

/** The result of resolving a file path. */
export interface ResolvedFileResult<T> {
    /** The data of the file. */
    data: T
    /** The index of the file. */
    index: number
    /** The relative path of the file. */
    relativePath: string    
}