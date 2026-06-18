import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"

/** Response for pinning a course capstone — returns the new pin id. */
@ObjectType({
    description: "Response for pinning a course capstone project.",
})
export class PinCourseProjectResponse extends AbstractGraphQLResponse {
    @Field(
        () => ID,
        {
            description: "Id of the newly created pin.",
        },
    )
        data: string
}
