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
    LivestreamSessionsQuery,
} from "./livestream-sessions.query"
import {
    LivestreamSessionsRequest,
    LivestreamSessionsResponseData,
} from "./graphql-types"

@Injectable()
export class LivestreamSessionsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<LivestreamSessionsRequest>,
    ): Promise<LivestreamSessionsResponseData> {
        return this.queryBus.execute(
            new LivestreamSessionsQuery(params),
        )
    }
}
