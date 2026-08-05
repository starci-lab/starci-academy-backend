import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Where a unit of real, weighted XP was earned from — every value here grants
 * a non-zero `amount` (the per-course leaderboard signal; also feeds the
 * global "Points" figure, `SUM(amount)` across every course, computed live by
 * `UserXpProjectionService` — never a maintained counter). Coin-ONLY rewards
 * (never XP) live in the separate {@link CoinSource} enum instead — see
 * `CoinHistoryEntity`. Used as the `source` of an append-only
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
    /** XP from finishing a flashcard quick-quiz session (amount = capped coverage reward). */
    FlashcardQuiz = "flashcardQuiz",
    /** XP from grading a flashcard for the FIRST time ever (amount = 2, once per user × card). */
    FlashcardFirstReview = "flashcardFirstReview",
}

export const GraphQLTypeXpSource = createEnumType(XpSource)

registerEnumType(
    GraphQLTypeXpSource,
    {
        name: "XpSource",
        description: "Where a unit of real, weighted XP was earned (challenge / lessonRead / milestone).",
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
            [XpSource.FlashcardQuiz]: {
                description: "XP from finishing a flashcard quick-quiz session.",
            },
            [XpSource.FlashcardFirstReview]: {
                description: "XP from grading a flashcard for the first time ever.",
            },
        },
    },
)
