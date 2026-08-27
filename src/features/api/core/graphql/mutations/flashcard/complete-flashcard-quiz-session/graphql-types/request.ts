import {
    Field, ID, InputType, Int
} from "@nestjs/graphql"
import {
    ArrayMaxSize, IsArray, IsInt, IsString, IsUUID, Min, ValidateNested
} from "class-validator"
import {
    Type
} from "class-transformer"

@InputType()
/** One final session-bound blank-to-token assignment. */
export class CompleteClozeQuizSelectionRequest {
    @Field(() => ID)
    @IsString()
        blankId: string

    @Field(() => ID)
    @IsUUID()
        tokenId: string
}

@InputType({
    description: "Finalize a v1 cloze session; the server grades opaque token identities."
})
/** Completion input containing no client-authored score or denominator. */
export class CompleteFlashcardQuizSessionRequest {
    @Field(() => ID)
    @IsUUID()
        sessionId: string

    @Field(() => Int)
    @IsInt()
    @Min(0)
        expectedVersion: number

    @Field(() => [CompleteClozeQuizSelectionRequest])
    @IsArray()
    @ArrayMaxSize(100)
    @ValidateNested({
        each: true
    })
    @Type(() => CompleteClozeQuizSelectionRequest)
        selections: Array<CompleteClozeQuizSelectionRequest>
}
