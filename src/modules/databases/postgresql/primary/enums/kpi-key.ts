import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * The weekly KPI a learner can set a personal target for. Each key maps to a
 * rolling-7-day counter (from the user-stats projection or derived) on the
 * dashboard weekly KPI summary + the `/kpi` editor page.
 */
export enum KpiKey {
    /** Lessons read this week. */
    Lessons = "lessons",
    /** Distinct days active this week (0-7). */
    StudyDays = "studyDays",
    /** Challenges passed this week. */
    Challenges = "challenges",
    /** Coding problems accepted this week. */
    Coding = "coding",
    /** Flashcards reviewed this week. */
    Flashcards = "flashcards",
    /** Personal-project milestone tasks passed this week. */
    Milestones = "milestones",
}

export const GraphQLTypeKpiKey = createEnumType(KpiKey)

registerEnumType(
    GraphQLTypeKpiKey,
    {
        name: "KpiKey",
        description: "A weekly KPI a learner can set a target for (lessons / studyDays / challenges / coding / flashcards / milestones).",
        valuesMap: {
            [KpiKey.Lessons]: {
                description: "Lessons read this week.",
            },
            [KpiKey.StudyDays]: {
                description: "Distinct days active this week (0–7).",
            },
            [KpiKey.Challenges]: {
                description: "Challenges passed this week.",
            },
            [KpiKey.Coding]: {
                description: "Coding problems accepted this week.",
            },
            [KpiKey.Flashcards]: {
                description: "Flashcards reviewed this week.",
            },
            [KpiKey.Milestones]: {
                description: "Personal-project milestone tasks passed this week.",
            },
        },
    },
)
