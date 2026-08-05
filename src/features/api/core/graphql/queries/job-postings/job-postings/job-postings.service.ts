import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    JobPostingsQuery,
} from "./job-postings.query"
import {
    JobPostingsRequest,
} from "./graphql-types/request"
import {
    JobPostingsData,
} from "./graphql-types/response"

@Injectable()
/**
 * Thin QueryBus facade -- wraps listing filters in {@link JobPostingsQuery}.
 * Pagination and search live in the matching handler.
 */
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
