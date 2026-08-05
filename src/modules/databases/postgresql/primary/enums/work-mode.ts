import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Preferred work arrangement the user advertises on their profile, shown next to
 * the "open to work" badge so recruiters can filter at a glance. Stored in
 * `users.work_mode` (nullable when the user has not stated a preference).
 */
export enum WorkMode {
    /** Profile matches remote-only recruiter filters. */
    Remote = "remote",
    /** Profile matches hybrid filters; excluded from remote-only and onsite-only lists. */
    Hybrid = "hybrid",
    /** Profile matches onsite-only recruiter filters. */
    Onsite = "onsite",
}

export const GraphQLTypeWorkMode = createEnumType(
    WorkMode,
)

registerEnumType(
    GraphQLTypeWorkMode,
    {
        name: "WorkMode",
        description: "Preferred work arrangement advertised on the user's profile.",
        valuesMap: {
            [WorkMode.Remote]: {
                description: "Prefers fully remote work.",
            },
            [WorkMode.Hybrid]: {
                description: "Prefers a hybrid (mixed remote / on-site) arrangement.",
            },
            [WorkMode.Onsite]: {
                description: "Prefers working on-site.",
            },
        },
    },
)
