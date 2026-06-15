import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    AdvertisementMediaType,
    GraphQLTypeAdvertisementMediaType,
    type AdvertisementMedia,
} from "@modules/databases"

/**
 * Render-ready advertisement banner for the dashboard right rail. `title`/`ctaText`
 * are already resolved to the request locale; `media` is the discriminated jsonb
 * payload the client narrows by `mediaType`.
 */
@ObjectType({
    description: "A dashboard advertisement banner (locale-resolved, render-ready).",
})
export class ActiveAdvertisementResponseData {
    @Field(
        () => String,
        {
            description: "Advertisement id.",
        },
    )
        id: string

    @Field(
        () => GraphQLTypeAdvertisementMediaType,
        {
            description: "Media kind — drives the client render branch + media shape.",
        },
    )
        mediaType: AdvertisementMediaType

    @Field(
        () => GraphQLJSON,
        {
            description: "Discriminated media payload (image / video / carousel) keyed by mediaType.",
        },
    )
        media: AdvertisementMedia

    @Field(
        () => String,
        {
            description: "Banner title resolved to the request locale.",
        },
    )
        title: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Call-to-action label (locale-resolved), or null.",
        },
    )
        ctaText: string | null

    @Field(
        () => String,
        {
            description: "Click destination for the whole banner.",
        },
    )
        linkUrl: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Sponsor name when this is a paid slot; null for the house ad.",
        },
    )
        sponsorName: string | null
}

/**
 * Response wrapper for the activeAdvertisement query (data null when no active ad).
 */
@ObjectType({
    description: "Response wrapper for the activeAdvertisement query.",
})
export class ActiveAdvertisementResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ActiveAdvertisementResponseData | null> {
    @Field(
        () => ActiveAdvertisementResponseData,
        {
            nullable: true,
            description: "The active banner, or null when none is currently active.",
        },
    )
        data: ActiveAdvertisementResponseData | null
}
