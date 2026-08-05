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
    ConsultantsQuery,
} from "./consultants.query"
import {
    ConsultantsRequest,
} from "./graphql-types/request"
import {
    ConsultantsResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Service for the Headhunters query.
 */
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
