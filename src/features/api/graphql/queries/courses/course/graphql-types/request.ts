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
    /**
     * Course id to fetch.
     */
    @Field(
        () => ID,
        {
            description: "Course id to fetch.",
            nullable: true,
        }
    )
        id?: string

    /**
     * Course display id to fetch.
     */
    @Field(
        () => ID,
        {
            description: "Course display id to fetch.",
            nullable: true,
        }
    )
        displayId?: string
}


