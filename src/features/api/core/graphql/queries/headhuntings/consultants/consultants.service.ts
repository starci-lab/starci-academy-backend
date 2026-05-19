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
    ConsultantsQuery,
} from "./consultants.query"
import {
    ConsultantsRequest,
    ConsultantsResponseData,
} from "./graphql-types"

/**
 * Service for the Headhunters query.
 */
@Injectable()
export class ConsultantsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<ConsultantsRequest>,
    ): Promise<ConsultantsResponseData> {
        return this.queryBus.execute(
            new ConsultantsQuery(params),
        )
    }
}
