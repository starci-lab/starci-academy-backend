import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching a lesson video by primary id.",
})
export class LessonVideoRequest {
    @Field(
        () => ID,
        {
            description: "Lesson video id to fetch.",
        },
    )
        id: string
}
