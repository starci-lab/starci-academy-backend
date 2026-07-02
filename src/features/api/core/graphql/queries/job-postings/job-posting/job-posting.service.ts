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
    JobPostingEntity,
} from "@modules/databases"
import {
    JobPostingQuery,
} from "./job-posting.query"
import type {
    JobPostingRequestParams,
} from "./types"

@Injectable()
export class JobPostingService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<JobPostingRequestParams>,
    ): Promise<JobPostingEntity> {
        return this.queryBus.execute(
            new JobPostingQuery(params),
        )
    }
}
