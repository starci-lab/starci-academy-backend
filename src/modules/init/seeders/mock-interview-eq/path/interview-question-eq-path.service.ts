import {
    Injectable,
} from "@nestjs/common"
import {
    PathResolverService,
    ResolvedFilePath,
} from "../../shared"

/**
 * Resolves indexed mock-interview-eq (behavioral, global) bank + question mount
 * folders. Unlike the technical {@link MockInterviewPathService} this walks
 * from the `mockInterviewEq` context root directly — there is no owning course to
 * scope under (`mock-interview-eq/{bank}/questions/{question}/`).
 */
@Injectable()
export class InterviewQuestionEqPathService {
    constructor(
        private readonly pathResolverService: PathResolverService,
    ) { }

    /**
     * Lists behavioral bank folder paths (`{index}-{slug}`) at the
     * `mock-interview-eq/` root.
     */
    async bankPaths(): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths(
            "mock-interview-eq",
            "",
        )
    }

    /**
     * Lists per-question folders under a bank's `questions/` directory — one
     * folder per behavioral mock-interview question (`{index}-{slug}/vi.md`).
     *
     * @param bankRelativePath - The bank folder path segment under `mock-interview-eq/`
     * @returns Paths of the question folders for that bank (empty when no `questions/` dir)
     */
    async questionPaths(
        bankRelativePath: string,
    ): Promise<Array<ResolvedFilePath>> {
        return await this.pathResolverService.filePaths(
            "mock-interview-eq",
            `${bankRelativePath}/questions`,
        )
    }
}
