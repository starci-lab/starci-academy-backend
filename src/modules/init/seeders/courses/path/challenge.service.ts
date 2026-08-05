import type {
    ChallengePathsParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

@Injectable()
/**
 * Resolves indexed challenge mount folders under a content's `challenges/` directory (`{index}-{slug}` or legacy `{index}`).
 */
export class ChallengePathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) { }

    /**
     * The relative path to the `challenges/` list root for the given course, module, and content folder.
     *
     * @param contentRelativePath - Content folder path segment under `contents/`
     */
    public relativePath(
        contentRelativePath: string,
    ): string {
        return `${contentRelativePath}/challenges`
    }
    /**
     * Lists challenge paths under `challenges/`.
     *
     * @param courseRelativePath - Course folder path under the courses root
     * @param moduleRelativePath - Module folder path segment under the course
     * @param contentRelativePath - Content folder path segment under `contents/`
     * @returns Paths of the challenge folders for that content
     */
    async paths(
        {
            contentRelativePath,
        }: ChallengePathsParams,
    ): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths("courses", 
            this.relativePath(
                contentRelativePath,
            ),
        )
    }
}


