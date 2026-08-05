import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * A single daily-quest task a learner can complete each day. Each key maps to a
 * "today" (Asia/Ho_Chi_Minh) activity counter the daily-quest service derives:
 * `readContent` from `xp_histories` (source `lessonRead`), `passChallenge` from
 * `xp_histories` (source `challenge`), `reviewFlashcards` from
 * `user_flashcard_reviews` reviewed today, `mockInterview` from
 * `mock_interview_attempts` created today, `quizSession` from
 * `flashcard_quiz_sessions` completed today.
 */
export enum DailyQuestKey {
    /** Read at least one lesson/content today. */
    ReadContent = "readContent",
    /** Pass at least one challenge today. */
    PassChallenge = "passChallenge",
    /** Review a number of flashcards today. */
    ReviewFlashcards = "reviewFlashcards",
    /** Complete one Mock Interview session today. */
    MockInterview = "mockInterview",
    /** Complete one Flashcard Quiz (Hoi nhanh) session today. */
    QuizSession = "quizSession",
}

export const GraphQLTypeDailyQuestKey = createEnumType(DailyQuestKey)

registerEnumType(
    GraphQLTypeDailyQuestKey,
    {
        name: "DailyQuestKey",
        description: "A daily-quest task (readContent / passChallenge / reviewFlashcards).",
        valuesMap: {
            [DailyQuestKey.ReadContent]: {
                description: "Read at least one lesson/content today.",
            },
            [DailyQuestKey.PassChallenge]: {
                description: "Pass at least one challenge today.",
            },
            [DailyQuestKey.ReviewFlashcards]: {
                description: "Review a number of flashcards today.",
            },
            [DailyQuestKey.MockInterview]: {
                description: "Complete one Mock Interview session today.",
            },
            [DailyQuestKey.QuizSession]: {
                description: "Complete one Flashcard Quiz (Hoi nhanh) session today.",
            },
        },
    },
)
