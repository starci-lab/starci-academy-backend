import {
    Field, ID, Int, ObjectType
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType()
/** One public cloze drop target. */
export class ClozeQuizBlankData {
    @Field(() => ID)
        blankId: string

    @Field(() => String,
        {
            nullable: true
        })
        hint?: string
}

@ObjectType()
/** One opaque single-use word-bank token. */
export class ClozeQuizTokenData {
    @Field(() => ID)
        tokenId: string

    @Field(() => String)
        label: string
}

@ObjectType()
/** One persisted blank-to-token assignment. */
export class ClozeQuizSelectionData {
    @Field(() => ID)
        blankId: string

    @Field(() => ID)
        tokenId: string
}

@ObjectType()
/** Playable item projection that deliberately omits its hidden answer key. */
export class ClozeQuizItemData {
    @Field(() => ID)
        cardId: string

    @Field(() => String)
        question: string

    @Field(() => String)
        clozeText: string

    @Field(() => [ClozeQuizBlankData])
        blanks: Array<ClozeQuizBlankData>

    @Field(() => [ClozeQuizTokenData])
        tokens: Array<ClozeQuizTokenData>
}

@ObjectType({
    description: "A playable server-owned cloze quiz session."
})
/** Newly created or idempotently replayed v1 session. */
export class StartFlashcardQuizSessionData {
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

    @Field(() => String)
        deadlineAt: string
}

@ObjectType()
/** GraphQL envelope for a v1 cloze session start. */
export class StartFlashcardQuizSessionResponse extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<StartFlashcardQuizSessionData> {
    @Field(() => StartFlashcardQuizSessionData,
        {
            nullable: true
        })
        data: StartFlashcardQuizSessionData
}
