import type {
    QuizDeckPathsParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

/**
 * Resolves indexed quiz-deck mount folders under a course's `quiz-decks/` directory (`{index}-{slug}`).
 */
@Injectable()
export class QuizDeckPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) { }

    /**
     * The relative path to the `quiz-decks/` list root for the given course folder.
     *
     * @param courseRelativePath - Course folder path segment under `courses/`
     */
    public relativePath(
        courseRelativePath: string,
    ): string {
        // decks live at the course root (sibling of `modules/` and `milestones/`)
        return `${courseRelativePath}/quiz-decks`
    }

    /**
     * Lists quiz-deck paths under `quiz-decks/`.
     *
     * @param courseRelativePath - Course folder path segment under `courses/`
     * @returns Paths of the deck folders for that course
     */
    async paths(
        {
            courseRelativePath,
        }: QuizDeckPathsParams,
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
