import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypePlaygroundSessionMode,
    PlaygroundSessionMode,
} from "@modules/databases/postgresql/primary/enums/playground-session-mode"

@InputType({
    description: "Playground to start a new pairing session for.",
})
/** Request for the createPlaygroundSession mutation. */
export class CreatePlaygroundSessionRequest {
    @Field(
        () => ID,
        {
            description: "Playground id to create a session for.",
        },
    )
        playgroundId: string

    /**
     * How much scaffolding the session should give the learner. Omitted =
     * {@link PlaygroundSessionMode.Guided} (the previous, only behavior).
     */
    @Field(
        () => GraphQLTypePlaygroundSessionMode,
        {
            nullable: true,
            description: "How much scaffolding the session gives the learner. Defaults to guided when omitted.",
        },
    )
        mode?: PlaygroundSessionMode
}
