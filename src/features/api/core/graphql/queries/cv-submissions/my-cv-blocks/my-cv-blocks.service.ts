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
    EmptyObject,
} from "@modules/common"
import {
    MyCvBlocksQuery,
} from "./my-cv-blocks.query"
import {
    CvBlocksDocument,
} from "./graphql-types"

@Injectable()
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
