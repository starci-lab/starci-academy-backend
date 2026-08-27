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
    ClozeQuizItemData, ClozeQuizSelectionData,
} from "../../../../mutations/flashcard/start-flashcard-quiz-session/graphql-types/response"

@ObjectType()
/** Active v1 state or a typed instruction to return to setup. */
export class MyInProgressFlashcardQuizSessionData {
    @Field(() => String)
        kind: "ACTIVE_V1" | "RECOVER_TO_SETUP"

    @Field(() => String,
        {
            nullable: true
        })
        reason?: string

    @Field(() => ID,
        {
            nullable: true
        })
        sessionId?: string

    @Field(() => Int,
        {
            nullable: true
        })
        contractVersion?: number

    @Field(() => [ClozeQuizItemData],
        {
            nullable: true
        })
        items?: Array<ClozeQuizItemData>

    @Field(() => Int,
        {
            nullable: true
        })
        currentIndex?: number

    @Field(() => [ClozeQuizSelectionData],
        {
            nullable: true
        })
        answerState?: Array<ClozeQuizSelectionData>

    @Field(() => Int,
        {
            nullable: true
        })
        answerVersion?: number

    @Field(() => String,
        {
            nullable: true
        })
        status?: string

    @Field(() => String,
        {
            nullable: true
        })
        updatedAt?: string

    @Field(() => String,
        {
            nullable: true
        })
        deadlineAt?: string
}

@ObjectType()
/** GraphQL envelope for active-session lookup and legacy recovery. */
export class MyInProgressFlashcardQuizSessionResponse extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyInProgressFlashcardQuizSessionData> {
    @Field(() => MyInProgressFlashcardQuizSessionData,
        {
            nullable: true
        })
        data: MyInProgressFlashcardQuizSessionData
}
