import type {
    PlaygroundStepPathsParams,
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
 * Resolves indexed step mount folders under a playground's `steps/` directory (`{index}-{slug}`).
 */
export class PlaygroundStepPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) { }

    /**
     * The relative path to the `steps/` list root for the given playground folder.
     *
     * @param playgroundRelativePath - Playground folder path segment under `courses/`
     */
    public relativePath(
        playgroundRelativePath: string,
    ): string {
        return `${playgroundRelativePath}/steps`
    }

    /**
     * Lists per-step folders under a playground's `steps/` directory -- one folder
     * per ordered step (`{index}-{slug}/{en,vi}.md`).
     *
     * @param playgroundRelativePath - Playground folder path segment under `courses/`
     * @returns Paths of the step folders for that playground (empty when no `steps/` dir)
     */
    async paths(
        {
            playgroundRelativePath,
        }: PlaygroundStepPathsParams,
    ): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths(
            "courses",
            this.relativePath(
                playgroundRelativePath,
            ),
        )
    }
}
