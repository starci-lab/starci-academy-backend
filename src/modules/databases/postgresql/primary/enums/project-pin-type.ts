import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Discriminator for a project pinned to a user's public profile.
 */
export enum ProjectPinType {
    /**
     * A pin that references one of the user's enrollments' capstone (personal
     * project). Title is derived from the course and the URL comes from
     * `enrollment.personalProjectGithubUrl`. Eligible for the
     * "Verified by StarCi" highlight.
     */
    Course = "course",
    /**
     * A free-form pin authored entirely by the user (title, description, url,
     * techStack). Never verified.
     */
    External = "external",
}

/**
 * GraphQL type for the project pin type enum.
 */
export const GraphQLTypeProjectPinType = createEnumType(
    ProjectPinType,
)

/**
 * Register the project pin type enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeProjectPinType,
    {
        name: "ProjectPinType",
        description: "Discriminator for a project pinned to a user's public profile.",
        valuesMap: {
            [ProjectPinType.Course]: {
                description: "References an enrollment capstone; verifiable.",
            },
            [ProjectPinType.External]: {
                description: "Free-form, user-authored project; never verified.",
            },
        },
    },
)
