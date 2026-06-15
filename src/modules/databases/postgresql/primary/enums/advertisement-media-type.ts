import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Media kind of an advertisement banner. Drives how the client renders the
 * banner and which shape the `media` jsonb carries (discriminated union).
 */
export enum AdvertisementMediaType {
    /** A single poster image. */
    Image = "image",
    /** A video clip (mp4 url or embed). */
    Video = "video",
    /** An auto-advancing slideshow of images. */
    Carousel = "carousel",
}

/** GraphQL type for the advertisement media-kind enum. */
export const GraphQLTypeAdvertisementMediaType = createEnumType(
    AdvertisementMediaType,
)

registerEnumType(
    GraphQLTypeAdvertisementMediaType,
    {
        name: "AdvertisementMediaType",
        description: "Media kind of an advertisement banner (image / video / carousel).",
        valuesMap: {
            [AdvertisementMediaType.Image]: {
                description: "A single poster image.",
            },
            [AdvertisementMediaType.Video]: {
                description: "A video clip (mp4 url or embed).",
            },
            [AdvertisementMediaType.Carousel]: {
                description: "An auto-advancing slideshow of images.",
            },
        },
    },
)
