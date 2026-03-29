import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"


/** Request for the course GraphQL query (by id). */
@InputType({
    description: "Request for fetching a course by id.",
})
export class CourseRequest {
    @Field(() => ID,
        {
            description: "Course id.",
        })
        id: string
}


