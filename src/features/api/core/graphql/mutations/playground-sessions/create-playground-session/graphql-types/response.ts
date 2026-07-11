import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

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
