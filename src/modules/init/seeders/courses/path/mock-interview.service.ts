import type {
    MockInterviewBankPathsParams,
} from "./types/mock-interview"
import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
} from "../../shared/path/resolver.service"
import {
    ResolvedFilePath,
} from "../../shared/path/types"

@Injectable()
/**
 * Resolves indexed mock-interview bank mount folders under a course's
 * `mock-interview/` directory (`{index}-{slug}`), and per-question folders
 * under a bank's `questions/` directory.
 */
export class MockInterviewPathService {
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
        // banks live at the course root (sibling of `modules/`/`flashcard-decks/`/`milestones/`)
        return `${courseRelativePath}/mock-interview`
    }

    /**
     * Lists mock-interview bank paths under `mock-interview/`.
     *
     * @param courseRelativePath - Course folder path segment under `courses/`
     * @returns Paths of the bank folders for that course
     */
    async paths(
        {
            courseRelativePath,
        }: MockInterviewBankPathsParams,
    ): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths(
            "courses",
            this.relativePath(
                courseRelativePath,
            ),
        )
    }

    /**
     * Lists per-question folders under a bank's `questions/` directory -- one
     * folder per authored interview question (`{index}-{slug}/{en,vi}.md`).
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

    /**
     * Lists per-language body folders under a code question's `bodies/` directory
     * (`{index}-{lang}/{en,vi}.md`, e.g. `0-typescript`, `3-go` -- mirrors lesson
     * content `bodies/`). Empty when the question has no `bodies/` dir (a no-code
     * kind, or a legacy single-`givenCode` question).
     *
     * @param questionRelativePath - The question folder path segment under `courses/`
     * @returns Paths of the per-language body folders for that question
     */
    async bodyPaths(
        questionRelativePath: string,
    ): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths(
            "courses",
            `${questionRelativePath}/bodies`,
        )
    }
}
