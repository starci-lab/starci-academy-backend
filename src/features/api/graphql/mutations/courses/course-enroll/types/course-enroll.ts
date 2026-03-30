import type {
    CourseEntity,
    UserEntity,
} from "@modules/databases"
import type {
    CourseEnrollRequest,
} from "../graphql-types/request"

/** Params for {@link CourseEnrollService.execute}. */
export interface CourseEnrollParams {
    request: CourseEnrollRequest
    user: UserEntity
}
/** Params for PayOS path after course and amount are resolved. */
export interface ExecutePayOsParams {
    course: CourseEntity
    user: UserEntity
    payosReturnUrl?: string
    payosCancelUrl?: string
}

/** Params for Sepay path after course and amount are resolved (future implementation). */
export interface ExecuteSepayParams {
    course: CourseEntity
    user: UserEntity
}
