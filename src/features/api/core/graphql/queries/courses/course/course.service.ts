import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    CourseEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CourseQuery,
} from "./course.query"
import {
    CourseRequest,
} from "./graphql-types"

@Injectable()
export class CourseService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<CourseRequest>,
    ): Promise<CourseEntity> {
        return this.queryBus.execute(
            new CourseQuery(params),
        )
    }
}
