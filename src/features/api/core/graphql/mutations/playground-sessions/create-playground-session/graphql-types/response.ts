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
/**
 * Fresh session snapshot: id + pairing code + mode + ordered steps.
 * When mode is Free, every step's `commandHint` is nulled server-side --
 * a free-mode learner's response must never contain the hint value.
 */
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
/**
 * Envelope for createPlaygroundSession. `data` is nullable so interceptor
 * error paths do not crash GraphQL over a missing session snapshot.
 */
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
