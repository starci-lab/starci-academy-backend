import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for pinning a course capstone project.",
})
/** Response for pinning a course capstone -- returns the new pin id. */
export class PinCourseProjectResponse extends AbstractGraphQLResponse {
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Id of the newly created pin (null on error).",
        },
    )
        data: string | null
}
