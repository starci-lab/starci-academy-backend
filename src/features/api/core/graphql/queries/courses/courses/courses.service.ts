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
    CoursesQuery,
} from "./courses.query"
import {
    CoursesRequest,
} from "./graphql-types/request"
import {
    CoursesResponseData,
} from "./graphql-types/response"

@Injectable()
/** Dispatches `CoursesQuery` onto the CQRS bus. */
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
