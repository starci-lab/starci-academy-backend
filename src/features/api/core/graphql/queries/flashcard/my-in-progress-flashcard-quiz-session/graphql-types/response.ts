import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "One synced per-card result of a resumable flashcard quick-quiz session.",
})
/** One synced in-flight card result, read back for a resumable session. */
export class MyInProgressFlashcardQuizSessionResultItem {
    @Field(
        () => ID,
        {
            description: "The flashcard this result belongs to.",
        },
    )
        cardId: string

    @Field(
        () => Int,
        {
            description: "How many cloze blanks on this card the learner filled correctly so far.",
        },
    )
        correctBlanks: number

    @Field(
        () => Int,
        {
            description: "Total cloze blanks on this card.",
        },
    )
        totalBlanks: number
}

@ObjectType({
    description: "The learner's most recent resumable flashcard quick-quiz session for one course.",
})
/**
 * The learner's most recent RESUMABLE flashcard quick-quiz session for one
 * course -- "resume flashcard quiz session" (2026-07-08). The query itself
 * resolves to `null` (not this type) when there is none.
 */
export class MyInProgressFlashcardQuizSessionData {
    @Field(
        () => ID,
        {
            description: "Id of the persisted session — pass to syncFlashcardQuizSessionProgress / completeFlashcardQuizSession.",
        },
    )
        sessionId: string

    @Field(
        () => [ID],
        {
            description: "The flashcard_cards.id set drawn for this session, in ask order.",
        },
    )
        cardIds: Array<string>

    @Field(
        () => Int,
        {
            description: "0-based index of the card the learner was on at the last sync.",
        },
    )
        currentIndex: number

    @Field(
        () => [MyInProgressFlashcardQuizSessionResultItem],
        {
            description: "The synced per-card results so far — empty when no sync has happened yet.",
        },
    )
        results: Array<MyInProgressFlashcardQuizSessionResultItem>

    @Field(
        () => String,
        {
            description: "ISO timestamp of when this session was last synced/updated.",
        },
    )
        updatedAt: string

    @Field(
        () => String,
        {
            description: "ISO timestamp of the session's lazy-expiry deadline (createdAt + the quiz session duration).",
        },
    )
        deadlineAt: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional user-chosen name for this practice session; null when the learner didn't name it (FE renders a time-based fallback).",
        },
    )
        name: string | null
}

@ObjectType({
    description: "Response wrapper for the myInProgressFlashcardQuizSession query.",
})
/**
     * ISO timestamp of the session's lazy-expiry deadline (`createdAt` +
     * `FLASHCARD_QUIZ_SESSION_DURATION_MS`) -- "session lazy-expiry"
     * (2026-07-11): a RESUMED session's countdown reflects the TRUE
     * remaining time (anchored to the original draw), never a freshly-reset
     * window. Mirrors `myInProgressMockInterviewSession`'s own `deadlineAt`.
     */
export class MyInProgressFlashcardQuizSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyInProgressFlashcardQuizSessionData>
{
    @Field(
        () => MyInProgressFlashcardQuizSessionData,
        {
            nullable: true,
            description: "The learner's most recent resumable session, or null when none exists.",
        },
    )
        data: MyInProgressFlashcardQuizSessionData
}
