import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
} from "@modules/databases"
import {
    CodingProblemService,
    CodingSubmissionService,
} from "@modules/bussiness"
import {
    UserCodingProblemDetailData,
    UserCodingProblemDetailRequest,
} from "./graphql-types"

/**
 * Live read backing the public profile's coding-problem-detail surface
 * (`/profile/<username>/skills/<slug>`) — the problem itself (no ownership
 * check, same read as the `codingProblem` query) plus the TARGET user's
 * (`request.userId`, the profile owner) accepted-submission summary, scoped
 * by the resolved problem id. Visibility for locked profiles is enforced
 * upstream by `GraphQLProfileVisibilityGuard` on the resolver, not here.
 */
@Injectable()
export class UserCodingProblemDetailService {
    constructor(
        private readonly codingProblemService: CodingProblemService,
        private readonly codingSubmissionService: CodingSubmissionService,
    ) {}

    async execute(
        request: UserCodingProblemDetailRequest,
        locale: Locale,
    ): Promise<UserCodingProblemDetailData> {
        const {
            userId,
            slug,
        } = request

        // same read as `codingProblem` — no ownership check, sample testcases only
        const problem = await this.codingProblemService.getBySlug({
            slug,
            locale,
        })

        // the TARGET user's accepted-submission summary (never sourceCode/perCaseResults)
        const submission = await this.codingSubmissionService.getAcceptedSummary({
            userId,
            problemId: problem.id,
        })

        return {
            problem,
            submission,
        }
    }
}
