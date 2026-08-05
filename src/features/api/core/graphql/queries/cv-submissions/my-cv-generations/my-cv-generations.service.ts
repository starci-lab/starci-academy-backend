import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MyCvGenerationsQuery,
} from "./my-cv-generations.query"
import {
    CvGenerationListItem,
    MyCvGenerationsRequest,
} from "./graphql-types"

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
