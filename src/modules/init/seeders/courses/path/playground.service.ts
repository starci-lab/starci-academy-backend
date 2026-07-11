import type {
    PlaygroundPathsParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

/**
 * Resolves indexed playground mount folders under a course's `playgrounds/` directory (`{index}-{slug}`).
 */
@Injectable()
export class PlaygroundPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) { }

    /**
     * The relative path to the `playgrounds/` list root for the given course folder.
     *
     * @param courseRelativePath - Course folder path segment under `courses/`
     */
    public relativePath(
        courseRelativePath: string,
    ): string {
        // playgrounds live at the course root (sibling of `modules/`, `flashcard-decks/`, and `milestones/`)
        return `${courseRelativePath}/playgrounds`
    }

    /**
     * Lists playground paths under `playgrounds/`.
     *
     * @param courseRelativePath - Course folder path segment under `courses/`
     * @returns Paths of the playground folders for that course
     */
    async paths(
        {
            courseRelativePath,
        }: PlaygroundPathsParams,
    ): Promise<Array<ResolvedFilePath>> {
        // delegate to the shared resolver which lists `{index}-{slug}` folders
        return await this.pathResolverService.filePaths(
            "courses",
            this.relativePath(
                courseRelativePath,
            ),
        )
    }
}
