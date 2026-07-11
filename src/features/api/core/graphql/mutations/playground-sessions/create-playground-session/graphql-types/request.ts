import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request for the createPlaygroundSession mutation. */
@InputType({
    description: "Playground to start a new pairing session for.",
})
export class CreatePlaygroundSessionRequest {
    @Field(
        () => ID,
        {
            description: "Playground id to create a session for.",
        },
    )
        playgroundId: string
}
