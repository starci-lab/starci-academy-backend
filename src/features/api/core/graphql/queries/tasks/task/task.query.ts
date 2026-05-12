import {
    ExecuteParams,
} from "../../../../types"
import {
    TaskRequest,
} from "./graphql-types"

export class TaskQuery {
    constructor(
        readonly params: ExecuteParams<TaskRequest>,
    ) {}
}
