import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MyCourseOutlineRequest,
} from "./graphql-types"

/**
 * CQRS query carrying the myCourseOutline request together with the resolved
 * viewer and locale (set by the resolver from the Keycloak guard + header).
 */
export class MyCourseOutlineQuery {
    constructor(
        readonly params: ExecuteParams<MyCourseOutlineRequest>,
    ) {}
}
