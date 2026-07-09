import type {
    InterviewQuestionBankPathsParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

/**
 * Resolves indexed mock-interview question bank mount folders under a course's
 * `mock-interview/` directory (`{index}-{slug}`).
 */
@Injectable()
export class InterviewQuestionBankPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) { }

    /**
     * The relative path to the `mock-interview/` list root for the given course folder.
     *
     * @param courseRelativePath - Course folder path segment under `courses/`
     */
    public relativePath(
        courseRelativePath: string,
    ): string {
        // banks live at the course root (sibling of `modules/` and `flashcard-decks/`)
        return `${courseRelativePath}/mock-interview`
    }

    /**
     * Lists mock-interview question bank paths under `mock-interview/`.
     *
     * @param courseRelativePath - Course folder path segment under `courses/`
     * @returns Paths of the bank folders for that course
     */
    async paths(
        {
            courseRelativePath,
        }: InterviewQuestionBankPathsParams,
    ): Promise<Array<ResolvedFilePath>> {
        // delegate to the shared resolver which lists `{index}-{slug}` folders
        return await this.pathResolverService.filePaths(
            "courses",
            this.relativePath(
                courseRelativePath,
            ),
        )
    }

    /**
     * Lists per-question folders under a bank's `questions/` directory — one
     * folder per mock-interview question (`{index}-{slug}/vi.md`).
     *
     * @param bankRelativePath - The bank folder path segment under `courses/`
     * @returns Paths of the question folders for that bank (empty when no `questions/` dir)
     */
    async questionPaths(
        bankRelativePath: string,
    ): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths(
            "courses",
            `${bankRelativePath}/questions`,
        )
    }
}
