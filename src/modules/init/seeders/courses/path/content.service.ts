import type {
    ContentPathsParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "./resolver.service"

/**
 * Resolves indexed content folders under a module’s `contents/` directory (`{index}-{slug}` or legacy `{index}`).
 */
@Injectable()
export class ContentPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) {}

    /**
     * The relative path to the content root under the module root.
     *
     * @param courseRelativePath - Course relative path
     * @param moduleRelativePath - Module relative path
     * @returns Path to the content root under the module root
     */
    public relativePath(moduleRelativePath: string): string {
        return `${moduleRelativePath}/contents`
    }
    /**
     * Lists content paths under `contents/`.
     *
     * @param courseRelativePath - Course relative path
     * @param moduleRelativePath - Module relative path
     * @returns Paths of the contents in the module
     */
    async paths(
        {
            moduleRelativePath,
        }: ContentPathsParams,
    ): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths(
            this.relativePath(moduleRelativePath)
        )
    }
}
