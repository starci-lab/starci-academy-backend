import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    IsUUID,
} from "class-validator"

@InputType({
    description: "Request to remove one of the user's pinned projects.",
})
/** Request to remove one of the current user's pinned projects. */
export class UnpinProjectRequest {
    @Field(
        () => ID,
        {
            description: "Id of the pin to remove (must belong to the user).",
        },
    )
    // must be a valid pin uuid; ownership is verified in the resolver
    @IsUUID()
        id: string
}
