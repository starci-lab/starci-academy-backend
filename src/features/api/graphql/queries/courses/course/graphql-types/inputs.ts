import {
    Field,
    InputType,
} from "@nestjs/graphql"

/** Filters for resolving a single course by id. */
@InputType({
    description: "Identifier for a single course.",
})
export class CourseFilters {
    @Field(() => String,
        {
            description: "Course id.",
        })
        id: string
}

/** Input for the course GraphQL query (by id). */
@InputType({
    description: "Request input for fetching a course by id.",
})
export class CourseInput {
    @Field(() => CourseFilters,
        {
            description: "Course selector.",
        })
        filters: CourseFilters
}
