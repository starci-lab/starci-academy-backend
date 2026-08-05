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
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import {
    MyCvBlocksQuery,
} from "./my-cv-blocks.query"
import {
    CvBlocksDocument,
} from "./graphql-types/response"

@Injectable()
/**
 * Dispatches `myCvBlocks` through QueryBus so the resolver never constructs
 * the CQRS query itself.
 */
export class MyCvBlocksService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<EmptyObject>,
    ): Promise<Array<CvBlocksDocument>> {
        return this.queryBus.execute(
            new MyCvBlocksQuery(params),
        )
    }
}
