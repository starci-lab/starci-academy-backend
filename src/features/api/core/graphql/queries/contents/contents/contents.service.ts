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
    ContentsQuery,
} from "./contents.query"
import {
    ContentsRequest,
    ContentsResponseData,
} from "./graphql-types"

@Injectable()
export class ContentsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<ContentsRequest>,
    ): Promise<ContentsResponseData> {
        return this.queryBus.execute(
            new ContentsQuery(params),
        )
    }
}
