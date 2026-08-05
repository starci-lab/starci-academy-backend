import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Summary of a playground for a course's playground list.",
})
/** One playground summary row for a course's playground list. */
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
/**
 * GraphQL envelope for the public `playgrounds` course listing. Rows are
 * summaries (id/slug/title/icon/stepCount) -- starting a session is a
 * separate gated mutation.
 */
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
