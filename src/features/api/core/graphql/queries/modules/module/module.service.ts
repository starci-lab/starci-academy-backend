import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ModuleQuery,
} from "./module.query"
import {
    ModuleRequest,
} from "./graphql-types/request"

@Injectable()
/** Dispatches `ModuleQuery` onto the CQRS bus. */
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
