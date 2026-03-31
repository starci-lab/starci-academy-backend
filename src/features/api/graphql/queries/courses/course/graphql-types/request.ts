import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    Locale,
    GraphQLTypeLocale,
} from "@modules/databases"


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
        }
    )
        id: string
    /**
     * Locale for the course. If not provided, the default locale for the course will be used.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale for the course.",
            defaultValue: Locale.En,
        }
    )
        locale: Locale
}


