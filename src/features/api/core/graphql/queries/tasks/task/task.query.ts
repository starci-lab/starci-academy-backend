import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    TaskRequest,
} from "./graphql-types/request"

/**
 * CQRS envelope carrying the `task` lookup (id + locale) from the resolver
 * into {@link TaskHandler}. The handler reads the milestone-task JSON from
 * S3 rather than Postgres.
 */
export class TaskQuery {
    constructor(
        readonly params: ExecuteParams<TaskRequest>,
    ) {}
}
