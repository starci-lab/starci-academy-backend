import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ModuleEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ModuleQuery,
} from "./module.query"
import {
    ModuleRequest,
} from "./graphql-types"

@Injectable()
export class ModuleService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<ModuleRequest>,
    ): Promise<ModuleEntity> {
        return this.queryBus.execute(
            new ModuleQuery(params),
        )
    }
}
