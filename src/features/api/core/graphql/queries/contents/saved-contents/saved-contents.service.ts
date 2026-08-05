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
    SavedContentsQuery,
} from "./saved-contents.query"
import {
    SavedContentsRequest,
    SavedContentsData,
} from "./graphql-types"

@Injectable()
/**
 * Thin QueryBus adapter so SavedContentsResolver never constructs SavedContentsQuery itself.
 */
export class SavedContentsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<SavedContentsRequest>,
    ): Promise<SavedContentsData> {
        return this.queryBus.execute(
            new SavedContentsQuery(params),
        )
    }
}
