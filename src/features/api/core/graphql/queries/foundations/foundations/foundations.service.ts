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
    FoundationsQuery,
} from "./foundations.query"
import {
    FoundationsRequest,
} from "./graphql-types/request"
import {
    FoundationsResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Service for the foundations query.
 */
export class FoundationsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<FoundationsRequest>,
    ): Promise<FoundationsResponseData> {
        return this.queryBus.execute(
            new FoundationsQuery(params),
        )
    }
}
