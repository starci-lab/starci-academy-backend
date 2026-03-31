import {
    Injectable,
    NotImplementedException,
} from "@nestjs/common"
import type {
    ExecuteParams,
} from "../../../../types"
import {
    CourseEnrollRequest,
} from "./graphql-types"

/**
 * Sepay-specific course enrollment (not implemented yet).
 */
@Injectable()
export class CourseEnrollSepayService {
    /**
     * Reserved for Sepay checkout + preflight persistence.
     *
     * @param _param - Same context as PayOS after pricing is resolved (unused until implemented)
     */
    async execute(
        _param: ExecuteParams<CourseEnrollRequest>,
    ): Promise<never> {
        throw new NotImplementedException(_param)
    }
}
