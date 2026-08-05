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
    MyCvGenerationsQuery,
} from "./my-cv-generations.query"
import {
    MyCvGenerationsRequest,
} from "./graphql-types/request"
import {
    CvGenerationListItem,
} from "./graphql-types/response"

@Injectable()
/**
 * Dispatches `myCvGenerations` through QueryBus so the resolver never
 * constructs the CQRS query itself.
 */
export class MyCvGenerationsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) { }

    async execute(
        params: ExecuteParams<MyCvGenerationsRequest>,
    ): Promise<Array<CvGenerationListItem>> {
        return this.queryBus.execute(
            new MyCvGenerationsQuery(params),
        )
    }
}
