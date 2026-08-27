import {
    Field, ID, Int, ObjectType
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse
} from "@modules/api/apollo/server/types/graphql-response"
import {
    ClozeQuizItemData,
    ClozeQuizSelectionData,
} from "../../start-flashcard-quiz-session/graphql-types/response"

@ObjectType()
/** Authoritative active-session state after an accepted or idempotent sync. */
export class SyncFlashcardQuizSessionProgressData {
    @Field(() => ID)
        sessionId: string

    @Field(() => Int)
        contractVersion: number

    @Field(() => [ClozeQuizItemData])
        items: Array<ClozeQuizItemData>

    @Field(() => Int)
        currentIndex: number

    @Field(() => [ClozeQuizSelectionData])
        answerState: Array<ClozeQuizSelectionData>

    @Field(() => Int)
        answerVersion: number

    @Field(() => String)
        status: string
}

@ObjectType()
/** GraphQL envelope for versioned cloze progress sync. */
export class SyncFlashcardQuizSessionProgressResponse extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SyncFlashcardQuizSessionProgressData> {
    @Field(() => SyncFlashcardQuizSessionProgressData,
        {
            nullable: true
        })
        data: SyncFlashcardQuizSessionProgressData
}
