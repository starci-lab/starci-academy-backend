import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * The XP outcome of finishing a flashcard quick-quiz session.
 */
@ObjectType({
    description: "The XP granted for a finished flashcard quick-quiz session.",
})
export class CompleteFlashcardQuizSessionData {
    @Field(
        () => Int,
        {
            description: "XP granted this call (0 on an idempotent replay).",
        },
    )
        xpEarned: number
}

/**
 * Response wrapper for the completeFlashcardQuizSession mutation.
 */
@ObjectType({
    description: "Response wrapper for the completeFlashcardQuizSession mutation.",
})
export class CompleteFlashcardQuizSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CompleteFlashcardQuizSessionData> {
    @Field(
        () => CompleteFlashcardQuizSessionData,
        {
            nullable: true,
            description: "The XP earned for the completed session.",
        },
    )
        data: CompleteFlashcardQuizSessionData
}
