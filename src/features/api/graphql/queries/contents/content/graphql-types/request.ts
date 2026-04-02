import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching a module content row by primary id.",
})
export class ContentRequest {
    @Field(
        () => ID,
        {
            description: "Content id to fetch.",
        },
    )
        id: string
}
