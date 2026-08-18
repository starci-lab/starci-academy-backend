import type {
    Request,
} from "express"

/**
 * GraphQL execution context shape for a resolver guarded by
 * `GraphQLEnrollmentGuard`, which injects `enrollmentId` onto the underlying
 * Express request once a course context (`x-course-id`) is resolved.
 * `enrollmentId` stays optional -- the guard is permissive and no-ops when no
 * course context is present on the request.
 */
export interface GraphQLEnrollmentContextParams {
    /** The underlying Express request, augmented with the resolved enrollment id. */
    req: Request & { enrollmentId?: string }
}
