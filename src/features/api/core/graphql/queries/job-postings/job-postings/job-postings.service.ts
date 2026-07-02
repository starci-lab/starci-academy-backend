import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    JobPostingsQuery,
} from "./job-postings.query"
import {
    JobPostingsData,
    JobPostingsRequest,
} from "./graphql-types"

@Injectable()
export class JobPostingsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<JobPostingsRequest>,
    ): Promise<JobPostingsData> {
        return this.queryBus.execute(
            new JobPostingsQuery(params),
        )
    }
}
