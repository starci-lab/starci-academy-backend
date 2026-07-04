import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a multi-course checkout that resolved to zero purchasable courses. */
export interface CoursesCheckoutEmptyExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the user who attempted the checkout. */
    userId: string
}

/**
 * Thrown when a multi-course (cart) checkout is requested but, after de-duplicating
 * the requested course ids and dropping the ones the user is already enrolled in,
 * there is nothing left to buy. The client should refresh the cart rather than
 * open a gateway for a zero-total order.
 */
export class CoursesCheckoutEmptyException extends AbstractException {
    constructor({
        userId,
        originalError,
    }: CoursesCheckoutEmptyExceptionMetadata) {
        super(
            "No purchasable courses in this checkout.",
            "COURSES_CHECKOUT_EMPTY_EXCEPTION",
            {
                userId,
                originalError,
            },
        )
    }
}
