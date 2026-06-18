import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"

/** Response for pinning an external project — returns the new pin id. */
@ObjectType({
    description: "Response for pinning an external project.",
})
export class PinExternalProjectResponse extends AbstractGraphQLResponse {
    @Field(
        () => ID,
        {
            description: "Id of the newly created pin.",
        },
    )
        data: string
}
