import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Course id to remove from the current user's shopping cart.",
})
/** Request for the removeFromCart mutation — identifies the course to drop from the caller's cart. */
export class RemoveFromCartRequest {
    /** Id of the course the user wants to remove from their cart. */
    @Field(
        () => ID,
        {
            description: "Course id.",
        },
    )
        courseId: string
}
