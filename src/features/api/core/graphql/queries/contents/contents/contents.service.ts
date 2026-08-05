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
    ContentsQuery,
} from "./contents.query"
import {
    ContentsRequest,
} from "./graphql-types/request"
import {
    ContentsResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Thin QueryBus adapter so ContentsResolver never constructs ContentsQuery itself.
 */
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
