import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** One playground summary row for a course's playground list. */
@ObjectType({
    description: "Summary of a playground for a course's playground list.",
})
export class PlaygroundSummary {
    @Field(
        () => ID,
        {
            description: "Playground id.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "URL-facing stable identifier for the playground.",
        },
    )
        slug: string

    @Field(
        () => String,
        {
            description: "Playground title.",
        },
    )
        title: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Icon shown next to the playground title (emoji or icon key).",
        },
    )
        icon: string | null

    @Field(
        () => Int,
        {
            description: "Number of steps in the playground.",
        },
    )
        stepCount: number
}

@ObjectType({
    description: "Response wrapper for the playgrounds query.",
})
export class PlaygroundsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<PlaygroundSummary>>
{
    @Field(
        () => [PlaygroundSummary],
        {
            nullable: true,
            description: "Playgrounds owned by the course, in display order.",
        },
    )
        data: Array<PlaygroundSummary>
}
