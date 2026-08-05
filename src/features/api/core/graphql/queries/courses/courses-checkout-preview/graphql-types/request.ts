import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Course ids to price as one multi-course order (cart preview).",
})
/**
 * Request for the multi-course checkout preview: the set of courses the buyer is
 * considering, so the server can price them exactly as `coursesCheckout` would.
 */
export class CoursesCheckoutPreviewRequest {
    /**
     * Ids of the courses in the cart. Duplicates and already-owned courses are
     * dropped server-side (same rules as the checkout itself).
     */
    @Field(
        () => [ID],
        {
            description: "Ids of the courses to price as one order.",
        },
    )
        courseIds: Array<string>
}
