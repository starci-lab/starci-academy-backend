import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Video delivery format for a lesson video.
 * Stored in `lesson_videos.video_type`.
 */
export enum LessonVideoType {
    /** Standard MP4 format. */
    Standard = "standard",
    /** MPEG-DASH adaptive streaming format. */
    MpegDash = "mpegDash",
}

/**
 * GraphQL type for lesson video type.
 */
export const GraphQLTypeLessonVideoType = createEnumType(
    LessonVideoType,
)

/**
 * Register GraphQL type for lesson video type.
 */
registerEnumType(
    GraphQLTypeLessonVideoType,
    {
        name: "LessonVideoType",
        description: "Video delivery format (standard MP4 or MPEG-DASH adaptive streaming).",
        valuesMap: {
            [LessonVideoType.Standard]: {
                description: "Standard MP4 format.",
            },
            [LessonVideoType.MpegDash]: {
                description: "MPEG-DASH adaptive streaming format.",
            },
        },
    },
)
