import {
    Field,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for the computed course mind-map graph.",
})
/**
 * Request for the course mind-map query. Accepts either the course primary-key id or its mount
 * slug (`displayId`) so the client can pass whichever it holds (the route uses the slug).
 */
export class CourseMindMapRequest {
    /** Course primary-key id OR mount slug (`displayId`), e.g. `fullstack-mastery`. */
    @Field(() => String,
        {
            description: "Course id or mount slug (displayId).",
        })
        courseId: string
}
