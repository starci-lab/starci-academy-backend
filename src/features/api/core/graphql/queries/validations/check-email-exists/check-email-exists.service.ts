import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CheckEmailExistsQuery,
} from "./check-email-exists.query"
import type {
    CheckEmailExistsData,
    CheckEmailExistsRequest,
} from "./graphql-types"

/** Service responsible for checking email existence via bloom filter. */
@Injectable()
export class CheckEmailExistsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<CheckEmailExistsRequest>,
    ): Promise<CheckEmailExistsData> {
        return this.queryBus.execute(
            new CheckEmailExistsQuery(params),
        )
    }
}

