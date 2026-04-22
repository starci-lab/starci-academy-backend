import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/types"
import {
    IncompleteChallengeSubmissionJobsQuery,
} from "./incomplete-challenge-submission-jobs.query"
import {
    IncompleteChallengeSubmissionJobsResponseData,
} from "./graphql-types"

@Injectable()
export class IncompleteChallengeSubmissionJobsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<undefined>,
    ): Promise<IncompleteChallengeSubmissionJobsResponseData> {
        return this.queryBus.execute(
            new IncompleteChallengeSubmissionJobsQuery(params),
        )
    }
}
