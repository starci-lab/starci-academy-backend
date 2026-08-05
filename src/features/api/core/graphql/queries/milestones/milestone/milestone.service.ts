import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    MilestoneEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MilestoneQuery,
} from "./milestone.query"
import {
    MilestoneRequest,
} from "./graphql-types"

@Injectable()
/** Dispatches `MilestoneQuery` onto the CQRS bus. */
export class MilestoneService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<MilestoneRequest>,
    ): Promise<MilestoneEntity> {
        return this.queryBus.execute(
            new MilestoneQuery(params),
        )
    }
}
