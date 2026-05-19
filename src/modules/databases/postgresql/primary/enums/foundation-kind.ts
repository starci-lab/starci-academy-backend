import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * The kind of a foundation resource item.
 */
export enum FoundationKind {
    /** Opens an external URL or a file under `.mount/data/foundations`. */
    ExternalLink = "external_link",
    /** MPEG-DASH video opened in a modal player. */
    Video = "video",
    /** Markdown article loaded from mount and shown in a modal. */
    Document = "document",
}

export const GraphQLTypeFoundationKind = createEnumType(FoundationKind)

registerEnumType(
    GraphQLTypeFoundationKind,
    {
        name: "FoundationKind",
        description: "The type/kind of resource a foundation item represents.",
        valuesMap: {
            [FoundationKind.ExternalLink]: {
                description: "External link or mount-relative resource path.",
            },
            [FoundationKind.Video]: {
                description: "MPEG-DASH video stream URL.",
            },
            [FoundationKind.Document]: {
                description: "Markdown document path under mount foundations data.",
            },
        },
    },
)

/** Maps legacy mount / DB enum strings to the current `FoundationKind`. */
export const normalizeFoundationKind = (raw: string): FoundationKind => {
    switch (raw.trim()) {
    case FoundationKind.ExternalLink:
    case FoundationKind.Video:
    case FoundationKind.Document:
        return raw.trim() as FoundationKind
    case "youtube_url":
    case "mpeg_dash_video":
        return FoundationKind.Video
    case "github_url":
        return FoundationKind.ExternalLink
    default:
        return FoundationKind.Document
    }
}
