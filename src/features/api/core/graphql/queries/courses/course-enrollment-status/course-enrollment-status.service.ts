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
    CourseEnrollmentStatusQuery,
} from "./course-enrollment-status.query"
import type {
    CourseEnrollmentStatusRequest,
} from "./graphql-types/request"
import type {
    CourseEnrollmentStatusData,
} from "./graphql-types/response"

@Injectable()
/** Dispatches `CourseEnrollmentStatusQuery` onto the CQRS bus. */
export class CourseEnrollmentStatusService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<CourseEnrollmentStatusRequest>,
    ): Promise<CourseEnrollmentStatusData> {
        return this.queryBus.execute(
            new CourseEnrollmentStatusQuery(params),
        )
    }
}
