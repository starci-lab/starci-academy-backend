import type {
    LessonVideoPathsParams,
    ResolvedFilePath,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
} from "./resolver.service"

/**
 * Resolves indexed lesson-video mount folders under a content’s `lesson-videos/` directory (`{index}-{slug}` or legacy `{index}`).
 */
@Injectable()
export class LessonVideoPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) { }

    /**
     * The relative path to the `lesson-videos/` list root for the given course, module, and content folder.
     *
     * @param contentRelativePath - Content folder path segment under `contents/`
     */
    public relativePath(
        contentRelativePath: string,
    ): string {
        return `${contentRelativePath}/lesson-videos`
    }

    /**
     * Lists lesson-video paths under `lesson-videos/`.
     *
     * @param courseRelativePath - Course folder path under the courses root
     * @param moduleRelativePath - Module folder path segment under the course
     * @param contentRelativePath - Content folder path segment under `contents/`
     * @returns Paths of the lesson-video folders for that content
     */
    async paths(
        {
            contentRelativePath,
        }: LessonVideoPathsParams,
    ): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths(
            this.relativePath(
                contentRelativePath,
            ),
        )
    }
}
