import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    FoundationEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    FoundationQuery,
} from "./foundation.query"
import {
    FoundationRequest,
} from "./graphql-types"

@Injectable()
/** Dispatches `FoundationQuery` onto the CQRS bus. */
export class FoundationService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<FoundationRequest>,
    ): Promise<FoundationEntity> {
        return this.queryBus.execute(
            new FoundationQuery(params),
        )
    }
}
