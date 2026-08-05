import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Course id to add to the current user's shopping cart.",
})
/** Request for the addToCart mutation — identifies the course to add to the caller's cart. */
export class AddToCartRequest {
    /** Id of the course the user wants to place in their cart. */
    @Field(
        () => ID,
        {
            description: "Course id.",
        },
    )
        courseId: string
}
