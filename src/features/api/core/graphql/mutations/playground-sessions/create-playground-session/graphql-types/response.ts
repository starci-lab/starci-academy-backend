import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    GraphQLTypePlaygroundSessionMode,
    PlaygroundSessionMode,
    PlaygroundStepEntity,
} from "@modules/databases"

@ObjectType({
    description: "Data for the createPlaygroundSession mutation.",
})
export class CreatePlaygroundSessionResponseData {
    @Field(
        () => ID,
        {
            description: "`playground_sessions.id` created for this run.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Short pairing code the CLI agent uses to join this session.",
        },
    )
        pairingCode: string

    @Field(
        () => GraphQLTypePlaygroundSessionMode,
        {
            description: "How much scaffolding this session gives the learner (guided / free).",
        },
    )
        mode: PlaygroundSessionMode

    /**
     * The playground's ordered steps, snapshotted for this session. When
     * {@link mode} is {@link PlaygroundSessionMode.Free}, every step's
     * `commandHint` is nulled out server-side here — a Free-mode learner's
     * response never contains the hint value.
     */
    @Field(
        () => [PlaygroundStepEntity],
        {
            description: "The playground's ordered steps for this session; `commandHint` is redacted (null) when `mode` is free.",
        },
    )
        steps: Array<PlaygroundStepEntity>
}

@ObjectType({
    description: "Response wrapper for the createPlaygroundSession mutation.",
})
export class CreatePlaygroundSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CreatePlaygroundSessionResponseData>
{
    @Field(
        () => CreatePlaygroundSessionResponseData,
        {
            nullable: true,
        },
    )
        data: CreatePlaygroundSessionResponseData
}
