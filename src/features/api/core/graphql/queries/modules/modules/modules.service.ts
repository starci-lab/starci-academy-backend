import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ModulesQuery,
} from "./modules.query"
import {
    ModulesRequest,
} from "./graphql-types/request"
import {
    ModulesResponseData,
} from "./graphql-types/response"
import {
    ExecuteParams,
} from "../../../../types/execute"
@Injectable()
/**
 * Service for performing modules queries.
 */
export class ModulesService {
    /**
     * Constructor.
     * @param queryBus - The query bus.
     */
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Executes the modules query.
     * @param params - The parameters.
     * @returns The modules response data.
     */
    async execute(
        params: ExecuteParams<ModulesRequest>,
    ): Promise<ModulesResponseData> {
        return this.queryBus.execute(
            new ModulesQuery(params),
        )
    }
}
