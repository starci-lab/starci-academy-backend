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
/**
 * Thin QueryBus facade — wraps the public display-id lookup in
 * {@link JobPostingQuery}. Logic lives in the matching handler.
 */
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
