import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    MyCourseOutlineRequest,
} from "./graphql-types/request"

/**
 * CQRS query carrying the myCourseOutline request together with the resolved
 * viewer and locale (set by the resolver from the Keycloak guard + header).
 */
export class MyCourseOutlineQuery {
    constructor(
        readonly params: ExecuteParams<MyCourseOutlineRequest>,
    ) {}
}
