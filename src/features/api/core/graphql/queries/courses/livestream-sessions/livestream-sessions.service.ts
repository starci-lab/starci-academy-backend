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
    LivestreamSessionsQuery,
} from "./livestream-sessions.query"
import {
    LivestreamSessionsRequest,
} from "./graphql-types/request"
import {
    LivestreamSessionsResponseData,
} from "./graphql-types/response"

@Injectable()
/** Dispatches `LivestreamSessionsQuery` onto the CQRS bus. */
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
