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
} from "../../../../types"
import {
    MilestonesSingleQuery,
} from "./milestones.query"
import {
    MilestonesRequest,
} from "./graphql-types"

@Injectable()
export class MilestonesService {
    constructor(
        private readonly queryBus: QueryBus,
    ) { }

    async execute(
        params: ExecuteParams<MilestonesRequest>,
    ): Promise<Array<MilestoneEntity>> {
        return this.queryBus.execute(
            new MilestonesSingleQuery(params),
        )
    }
}
