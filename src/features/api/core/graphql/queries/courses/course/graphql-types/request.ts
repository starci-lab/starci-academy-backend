import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"


@InputType({
    description: "Request for fetching a course by id.",
})
/** Request for the course GraphQL query (by id). */
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


