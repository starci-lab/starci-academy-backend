import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Where a unit of XP was earned from. Mirrors the three signals the per-course
 * leaderboard sums (`leaderboard.service.ts`): passed challenge attempts, read
 * lessons, and passed milestone tasks. Used as the `source` of an append-only
 * {@link XpHistoryEntity} audit row.
 */
export enum XpSource {
    /** XP from a passed challenge submission attempt (amount = attempt score). */
    Challenge = "challenge",
    /** XP from reading a lesson/content for the first time (amount = 3). */
    LessonRead = "lessonRead",
    /** XP from passing a milestone task (amount = 10, once per task). */
    Milestone = "milestone",
    /** XP from a first clean coding-practice solve (amount = problem points). */
    Coding = "coding",
}

export const GraphQLTypeXpSource = createEnumType(XpSource)

registerEnumType(
    GraphQLTypeXpSource,
    {
        name: "XpSource",
        description: "Where a unit of XP was earned (challenge / lessonRead / milestone).",
        valuesMap: {
            [XpSource.Challenge]: {
                description: "XP from a passed challenge submission attempt.",
            },
            [XpSource.LessonRead]: {
                description: "XP from reading a lesson for the first time.",
            },
            [XpSource.Milestone]: {
                description: "XP from passing a milestone task.",
            },
            [XpSource.Coding]: {
                description: "XP from a first clean coding-practice solve.",
            },
        },
    },
)
