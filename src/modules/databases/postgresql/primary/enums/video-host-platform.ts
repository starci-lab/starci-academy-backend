import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Where the lesson video is hosted (YouTube, Drive, etc.).
 * Stored in `lesson_videos.host_platform`.
 */
export enum VideoHostPlatform {
    Youtube = "youtube",
    GoogleDrive = "googleDrive",
    Vimeo = "vimeo",
    CloudflareStream = "cloudflareStream",
    Other = "other",
}

export const GraphQLTypeVideoHostPlatform = createEnumType(
    VideoHostPlatform,
)

registerEnumType(
    GraphQLTypeVideoHostPlatform,
    {
        name: "VideoHostPlatform",
        description: "Third-party host or delivery platform for the lesson video URL.",
        valuesMap: {
            [VideoHostPlatform.Youtube]: {
                description: "YouTube.",
            },
            [VideoHostPlatform.GoogleDrive]: {
                description: "Google Drive (or shared file link).",
            },
            [VideoHostPlatform.Vimeo]: {
                description: "Vimeo.",
            },
            [VideoHostPlatform.CloudflareStream]: {
                description: "Cloudflare Stream.",
            },
            [VideoHostPlatform.Other]: {
                description: "Other host (custom URL).",
            },
        },
    },
)
