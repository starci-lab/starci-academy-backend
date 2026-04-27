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
    CoursesQuery,
} from "./courses.query"
import {
    CoursesRequest,
    CoursesResponseData,
} from "./graphql-types"

@Injectable()
export class CoursesService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<CoursesRequest>,
    ): Promise<CoursesResponseData> {
        return this.queryBus.execute(
            new CoursesQuery(params),
        )
    }
}
