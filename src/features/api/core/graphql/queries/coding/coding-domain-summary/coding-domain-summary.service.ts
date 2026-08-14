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
    CodingDomainSummaryQuery,
} from "./coding-domain-summary.query"
import {
    CodingDomainSummaryResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Dispatches `codingDomainSummary` through QueryBus so the resolver never
 * constructs the CQRS query itself.
 */
export class CodingDomainSummaryService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<void>,
    ): Promise<CodingDomainSummaryResponseData> {
        return this.queryBus.execute(
            new CodingDomainSummaryQuery(params),
        )
    }
}
