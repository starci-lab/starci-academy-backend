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
    FoundationsQuery,
} from "./foundations.query"
import {
    FoundationsRequest,
    FoundationsResponseData,
} from "./graphql-types"

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
