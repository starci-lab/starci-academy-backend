import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    MilestonesQuery,
} from "./milestones.query"
import {
    MilestonesRequest,
    MilestonesResponseData,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../types"

@Injectable()
/** Dispatches `MilestonesQuery` onto the CQRS bus. */
export class MilestonesService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<MilestonesRequest>,
    ): Promise<MilestonesResponseData> {
        return this.queryBus.execute(
            new MilestonesQuery(params),
        )
    }
}
