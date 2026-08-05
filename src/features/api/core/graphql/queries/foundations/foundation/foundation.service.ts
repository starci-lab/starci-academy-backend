import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    FoundationQuery,
} from "./foundation.query"
import {
    FoundationRequest,
} from "./graphql-types/request"

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
