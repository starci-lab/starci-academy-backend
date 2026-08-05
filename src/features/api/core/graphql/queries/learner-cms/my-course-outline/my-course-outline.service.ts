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
    MyCourseOutlineQuery,
} from "./my-course-outline.query"
import {
    MyCourseOutlineData,
    MyCourseOutlineRequest,
} from "./graphql-types"

@Injectable()
/**
 * Thin service for the myCourseOutline query: dispatches the assembly work to the
 * CQRS handler via the query bus.
 */
export class MyCourseOutlineService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Execute the myCourseOutline query.
     * @param params - The request together with the resolved viewer + locale.
     * @returns The assembled course outline with the viewer's progress overlaid.
     */
    async execute(
        params: ExecuteParams<MyCourseOutlineRequest>,
    ): Promise<MyCourseOutlineData> {
        // delegate to the CQRS handler; it owns the read-only tree + progress join
        return this.queryBus.execute(
            new MyCourseOutlineQuery(params),
        )
    }
}
