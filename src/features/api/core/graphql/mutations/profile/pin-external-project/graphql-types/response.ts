import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for pinning an external project.",
})
/** Response for pinning an external project -- returns the new pin id. */
export class PinExternalProjectResponse extends AbstractGraphQLResponse {
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Id of the newly created pin (null on error).",
        },
    )
        data: string | null
}
