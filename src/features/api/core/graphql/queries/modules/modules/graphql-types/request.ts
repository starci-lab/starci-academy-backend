import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for listing all modules in a course.",
})
export class ModulesRequest {
    @Field(
        () => ID,
        {
            description: "Course id; all modules in this course are returned.",
        },
    )
        courseId: string
}
