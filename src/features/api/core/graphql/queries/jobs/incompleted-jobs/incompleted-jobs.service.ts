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
    IncompletedJobsQuery,
} from "./incompleted-jobs.query"
import {
    IncompletedJobsResponseData,
} from "./graphql-types"

@Injectable()
export class IncompletedJobsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<undefined>,
    ): Promise<IncompletedJobsResponseData> {
        return this.queryBus.execute(
            new IncompletedJobsQuery(params),
        )
    }
}
